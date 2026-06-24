import { TestRepository } from '../repositories/test.repository';
import prisma from '../config/db';
import axios from 'axios';
import redisClient from '../config/redis';

const testRepository = new TestRepository();
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export class TestService {
  async startTest(userId: string, examCode: string) {
    // 1. Redis active session locking check
    const activeAttemptId = await redisClient.get(`user:${userId}:active_attempt`);
    if (activeAttemptId) {
      throw new Error('You already have an active test session running');
    }

    // 2. Get or create exam
    const examTitle = examCode.replace('-', ' ').toUpperCase();
    const exam = await testRepository.getFirstOrCreateExam(examCode, examTitle);

    // 3. Check if we need to seed starter questions for this exam
    const existingQuestions = await testRepository.getQuestionsByExam(exam.id);
    if (existingQuestions.length === 0) {
      await this.seedExamData(exam.id);
    }

    // 4. Create test attempt
    const attempt = await testRepository.createAttempt(userId, exam.id);

    // 5. Store Redis attempt active metadata and locks
    const startedAt = attempt.startTime.toISOString();
    await redisClient.set(`attempt:${attempt.id}:active`, JSON.stringify({
      userId,
      attemptId: attempt.id,
      startedAt
    }));
    await redisClient.set(`user:${userId}:active_attempt`, attempt.id);
    await redisClient.set(`attempt:${attempt.id}:violations`, '0');

    // 6. Retrieve questions to serve the user
    const questions = await testRepository.getQuestionsByExam(exam.id);

    return {
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        code: exam.code,
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        subject: q.subject.name,
        topic: q.topic.name,
      })),
      startTime: attempt.startTime,
      durationSeconds: attempt.durationSeconds,
    };
  }

  async submitTest(
    attemptId: string, 
    answers: Array<{ questionId: string; answerSelected: string; timeSpentSeconds: number }> = [],
    antiCheatLogs?: Array<{ eventType: string; details?: string }>,
    status: string = 'COMPLETED'
  ) {
    const attempt = await testRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error('Test attempt not found');
    }
    if (attempt.status === 'COMPLETED' || attempt.status === 'SUBMITTED') {
      return {
        attemptId: attempt.id,
        score: attempt.score,
        rankEstimated: attempt.rankEstimated,
        status: attempt.status,
        startTime: attempt.startTime,
        endTime: attempt.endTime
      };
    }

    // Release Redis session locks
    await redisClient.del(`attempt:${attemptId}:active`);
    await redisClient.del(`user:${attempt.userId}:active_attempt`);
    await redisClient.del(`attempt:${attemptId}:violations`);
    await redisClient.del(`dashboard:${attempt.userId}`); // Invalidate dashboard cache


    // 1. Save anti-cheat logs
    if (antiCheatLogs && antiCheatLogs.length > 0) {
      for (const log of antiCheatLogs) {
        await testRepository.createAntiCheatLog(attemptId, log.eventType, log.details, attempt.userId);
      }
    }

    // 2. Fetch questions for validation
    const dbQuestions = await prisma.question.findMany({
      where: {
        subject: {
          examId: attempt.examId
        }
      },
      include: {
        subject: true,
        topic: true
      }
    });

    let totalScore = 0;
    const userAnswersToSave = [];

    // 3. Calculate scores
    if (answers && answers.length > 0) {
      for (const ans of answers) {
        const q = dbQuestions.find(dq => dq.id === ans.questionId);
        if (!q) continue;

        const marks = 2.0;
        let isCorrect = false;

        if (q.type === 'MCQ') {
          isCorrect = q.correctAnswer.trim() === ans.answerSelected.trim();
          if (isCorrect) {
            totalScore += marks;
          } else {
            totalScore -= (marks / 3.0); // 1/3 negative
          }
        } else if (q.type === 'MSQ') {
          const correctKeys = q.correctAnswer.split(',').sort().join(',');
          const selectedKeys = ans.answerSelected.split(',').sort().join(',');
          isCorrect = correctKeys === selectedKeys;
          if (isCorrect) {
            totalScore += marks;
          }
        } else if (q.type === 'NAT') {
          const corrVal = parseFloat(q.correctAnswer);
          const userVal = parseFloat(ans.answerSelected);
          isCorrect = !isNaN(corrVal) && !isNaN(userVal) && Math.abs(corrVal - userVal) < 0.01;
          if (isCorrect) {
            totalScore += marks;
          }
        }

        userAnswersToSave.push({
          attemptId,
          questionId: q.id,
          answerSelected: ans.answerSelected,
          isCorrect,
          timeSpentSeconds: ans.timeSpentSeconds
        });
      }
    }

    // Ensure score is not negative
    totalScore = Math.max(0, parseFloat(totalScore.toFixed(2)));

    // 4. Save Answers to DB
    if (userAnswersToSave.length > 0) {
      await testRepository.createUserAnswers(userAnswersToSave);
    }

    // 5. Predict Rank & Analyze Weak Topics via AI Engine
    let rankEstimated = 9999;
    try {
      const normalizedScore = (totalScore / (dbQuestions.length * 2)) * 100;
      const rankResponse = await axios.post(`${AI_ENGINE_URL}/api/rank/predict`, {
        score: normalizedScore,
        branch: attempt.exam.code.split('-')[1]?.toUpperCase() || 'CS',
        category: 'General'
      });
      rankEstimated = rankResponse.data.estimated_rank_min;
    } catch (err: any) {
      console.error('Failed to query AI engine for rank prediction, running fallback:', err.message);
      rankEstimated = Math.max(1, Math.round((100 - totalScore) * 120));
    }

    // 6. Calculate Percentile
    const totalCandidates = 100000;
    const percentile = parseFloat((Math.max(0.1, Math.min(99.99, 100 - (rankEstimated / totalCandidates) * 100))).toFixed(2));

    // 7. Update Attempt status in DB
    const completedAttempt = await testRepository.updateAttempt(attemptId, {
      score: totalScore,
      rankEstimated,
      percentile,
      status, // COMPLETED or SUBMITTED
      endTime: new Date()
    });

    return {
      attemptId: completedAttempt.id,
      score: completedAttempt.score,
      rankEstimated: completedAttempt.rankEstimated,
      percentile: completedAttempt.percentile,
      status: completedAttempt.status,
      startTime: completedAttempt.startTime,
      endTime: completedAttempt.endTime
    };
  }

  async getHistory(userId: string) {
    return testRepository.findAttemptsByUserId(userId);
  }

  async getRemainingTime(attemptId: string) {
    const attempt = await testRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error('Test attempt not found');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return {
        remainingSeconds: 0,
        isExpired: true,
        status: attempt.status
      };
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
    const remainingSeconds = Math.max(0, attempt.durationSeconds - elapsedSeconds);

    if (remainingSeconds <= 0) {
      // Auto submit test since timer expired
      await testRepository.createAntiCheatLog(attemptId, 'AUTO_SUBMIT', 'Test automatically submitted due to server timer expiration.', attempt.userId);
      const result = await this.submitTest(attemptId, [], [], 'SUBMITTED');
      
      return {
        remainingSeconds: 0,
        isExpired: true,
        status: 'SUBMITTED',
        result
      };
    }

    return {
      remainingSeconds,
      isExpired: false,
      status: attempt.status
    };
  }

  async logCheatEvent(
    attemptId: string,
    eventType: string,
    details?: string,
    userId?: string,
    answers: any[] = []
  ) {
    const attempt = await testRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new Error('Test attempt not found');
    }

    // If test is not in progress, do nothing
    if (attempt.status !== 'IN_PROGRESS') {
      return {
        autoSubmitted: false,
        violationsCount: attempt.violationsCount,
        credibilityScore: attempt.credibilityScore,
        status: attempt.status
      };
    }

    // 1. Calculate penalty
    const PENALTIES: Record<string, number> = {
      TAB_SWITCH: 10,
      WINDOW_BLUR: 10,
      FULLSCREEN_EXIT: 15,
      MULTIPLE_LOGIN: 20
    };
    const penalty = PENALTIES[eventType] || 0;

    // 2. Increment Redis violation counter
    const newViolationsCount = await redisClient.incr(`attempt:${attemptId}:violations`);

    // 3. Deduct penalty from credibility score
    const newCredibilityScore = Math.max(0, attempt.credibilityScore - penalty);

    // 4. Log to DB AntiCheatLog table
    await testRepository.createAntiCheatLog(attemptId, eventType, details, userId || attempt.userId);

    // 5. Update violations and credibility score on attempt in PostgreSQL
    await testRepository.updateAttempt(attemptId, {
      violationsCount: newViolationsCount,
      credibilityScore: newCredibilityScore
    });

    // 6. Check for auto-submit (violations > 3 or AUTO_SUBMIT event)
    if (newViolationsCount > 3 || eventType === 'AUTO_SUBMIT') {
      // Log another anti-cheat log for AUTO_SUBMIT
      await testRepository.createAntiCheatLog(attemptId, 'AUTO_SUBMIT', 'Test automatically submitted due to security violations.', userId || attempt.userId);
      
      // Auto submit attempt
      const result = await this.submitTest(attemptId, answers, [], 'SUBMITTED');
      
      return {
        autoSubmitted: true,
        violationsCount: newViolationsCount,
        credibilityScore: newCredibilityScore,
        status: 'SUBMITTED',
        result
      };
    }

    return {
      autoSubmitted: false,
      violationsCount: newViolationsCount,
      credibilityScore: newCredibilityScore,
      status: attempt.status
    };
  }

  // --- Seeding Core questions if DB is fresh ---
  private async seedExamData(examId: string) {
    console.log(`Auto-seeding questions for exam identifier: ${examId}`);
    
    // Create high-yield subjects
    const subMath = await prisma.subject.create({ data: { name: 'Engineering Mathematics', examId } });
    const subGA = await prisma.subject.create({ data: { name: 'General Aptitude', examId } });
    const subCore = await prisma.subject.create({ data: { name: 'Core Computer Science', examId } });

    // Create topics
    const topicLinear = await prisma.topic.create({ data: { name: 'Linear Algebra', subjectId: subMath.id } });
    const topicProbability = await prisma.topic.create({ data: { name: 'Probability & Statistics', subjectId: subMath.id } });
    const topicVerbal = await prisma.topic.create({ data: { name: 'Verbal Aptitude', subjectId: subGA.id } });
    const topicQuant = await prisma.topic.create({ data: { name: 'Quantitative Aptitude', subjectId: subGA.id } });
    const topicAlgo = await prisma.topic.create({ data: { name: 'Algorithms', subjectId: subCore.id } });
    const topicOS = await prisma.topic.create({ data: { name: 'Operating Systems', subjectId: subCore.id } });

    // Seed questions
    const questionsData = [
      {
        text: 'What is the rank of the matrix [[1, 2], [2, 4]]?',
        type: 'MCQ',
        options: ['0', '1', '2', '3'],
        correctAnswer: '1',
        explanation: 'The second row is a multiple of the first row, so the determinant is 0. Only one linearly independent row exists. Thus rank = 1.',
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'A bag contains 5 red and 3 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?',
        type: 'NAT',
        options: [],
        correctAnswer: '0.357', // 5/8 * 4/7 = 20/56 = 0.357
        explanation: 'P(R1) = 5/8. P(R2|R1) = 4/7. P(R1 and R2) = (5/8) * (4/7) = 20/56 = 5/14 ≈ 0.357',
        subjectId: subMath.id,
        topicId: topicProbability.id
      },
      {
        text: 'Identify the word closest in meaning to: EPHEMERAL',
        type: 'MCQ',
        options: ['Eternal', 'Short-lived', 'Spiritual', 'Logical'],
        correctAnswer: '1',
        explanation: 'Ephemeral means lasting for a very short time.',
        subjectId: subGA.id,
        topicId: topicVerbal.id
      },
      {
        text: 'In a group of 60 people, 27 like cold drinks and 42 like hot drinks, and each person likes at least one of the two. How many like both?',
        type: 'NAT',
        options: [],
        correctAnswer: '9', // 27 + 42 - 60 = 9
        explanation: 'N(A U B) = N(A) + N(B) - N(A ∩ B) => 60 = 27 + 42 - X => X = 9.',
        subjectId: subGA.id,
        topicId: topicQuant.id
      },
      {
        text: 'Which of the following statements about Binary Search trees are correct? Select all that apply.',
        type: 'MSQ',
        options: [
          'Inorder traversal of BST gives keys in sorted order',
          'Search time in BST is always O(log n)',
          'The maximum depth of a BST with n nodes is O(n)',
          'Preorder traversal of BST gives keys in sorted order'
        ],
        correctAnswer: '0,2', // option index 0 and 2 are correct
        explanation: 'Inorder gives sorted keys. Search in a skewed BST can take O(n) time. The maximum depth of skewed BST is O(n).',
        subjectId: subCore.id,
        topicId: topicAlgo.id
      },
      {
        text: 'Which scheduling algorithm can cause starvation? Select all that apply.',
        type: 'MSQ',
        options: [
          'First-Come First-Served (FCFS)',
          'Shortest Job First (SJF)',
          'Round Robin (RR)',
          'Priority Scheduling'
        ],
        correctAnswer: '1,3', // SJF and Priority can cause starvation
        explanation: 'SJF can starve long jobs. Priority scheduling can starve lower-priority jobs. FCFS and RR ensure everyone runs eventually.',
        subjectId: subCore.id,
        topicId: topicOS.id
      }
    ];

    for (const q of questionsData) {
      await prisma.question.create({
        data: q
      });
    }
  }
}
