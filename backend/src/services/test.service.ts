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
      await this.seedExamData(exam.id, examCode);
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
      }, { timeout: 3000 });
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
  private async seedExamData(examId: string, examCode?: string) {
    console.log(`Auto-seeding questions for exam identifier: ${examId}, code: ${examCode}`);
    
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

    let questionsData = [];

    const normCode = (examCode || '').toLowerCase();

    if (normCode.includes('2025')) {
      questionsData = [
        {
          text: 'Consider a 3x3 matrix A with eigenvalues 1, 2, and 5. What is the determinant of matrix A^2?',
          type: 'MCQ',
          options: ['8', '10', '20', '100'],
          correctAnswer: '3',
          explanation: 'The determinant of a matrix is the product of its eigenvalues. So det(A) = 1 * 2 * 5 = 10. Thus, det(A^2) = (det(A))^2 = 10^2 = 100.',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'Suppose X is a random variable that follows a Poisson distribution. If P(X=0) = 0.1, what is the variance of X? (Round to 3 decimal places)',
          type: 'NAT',
          options: [],
          correctAnswer: '2.303',
          explanation: 'For a Poisson distribution, P(X=0) = e^(-L) = 0.1, which means -L = ln(0.1) => L = ln(10) ≈ 2.303. Since the parameter L represents both the mean and the variance of a Poisson distribution, the variance is 2.303.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Select the word that is opposite in meaning to: ALACRITY',
          type: 'MCQ',
          options: ['Apathy', 'Eagerness', 'Clarity', 'Swiftness'],
          correctAnswer: '0',
          explanation: 'Alacrity means brisk and cheerful readiness. Its opposite is apathy, which means lack of interest or enthusiasm.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'A work can be completed by 10 men in 15 days. How many days will it take for 15 men to complete the same work?',
          type: 'NAT',
          options: [],
          correctAnswer: '10',
          explanation: 'Total man-days required = 10 * 15 = 150. For 15 men, days required = 150 / 15 = 10 days.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following are true for a minimum spanning tree (MST) of a connected, undirected graph with distinct positive edge weights? Select all that apply.',
          type: 'MSQ',
          options: [
            'The shortest edge in the graph is always part of the MST',
            'The longest edge in the graph is never part of the MST',
            'The MST is unique',
            'Dijkstra\'s algorithm can be used to find the MST'
          ],
          correctAnswer: '0,2',
          explanation: 'The shortest edge is always in MST by Kruskal\'s cut property. If all edge weights are distinct, the MST is unique. The longest edge can be part of MST (e.g. in a tree graph itself). Dijkstra is for shortest paths, not MST.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following resources can be shared among threads of the same process? Select all that apply.',
          type: 'MSQ',
          options: [
            'Address space',
            'Stack',
            'Register set',
            'File descriptors'
          ],
          correctAnswer: '0,3',
          explanation: 'Threads of the same process share the process\'s address space (code, data) and system resources like open file descriptors. However, each thread gets its own private stack and register set.',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else if (normCode.includes('2024')) {
      questionsData = [
        {
          text: 'If A is a 2x2 real matrix such that A + A^T = 0, which of the following is true?',
          type: 'MCQ',
          options: ['A is symmetric', 'A is skew-symmetric', 'A is identity', 'A is invertible'],
          correctAnswer: '1',
          explanation: 'A matrix A that satisfies A^T = -A (or A + A^T = 0) is skew-symmetric.',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'A coin is tossed 3 times. What is the probability of getting exactly 2 heads? (Round to 3 decimal places)',
          type: 'NAT',
          options: [],
          correctAnswer: '0.375',
          explanation: 'Possible outcomes are 2^3 = 8. Outcomes with exactly 2 heads are {HHT, HTH, THH} (3 outcomes). P(exactly 2 H) = 3/8 = 0.375.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Identify the word closest in meaning to: PRAGMATIC',
          type: 'MCQ',
          options: ['Practical', 'Idealistic', 'Dreamy', 'Vague'],
          correctAnswer: '0',
          explanation: 'Pragmatic means dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'If the price of a commodity increases by 25%, by what percentage must a household reduce its consumption so that the expenditure remains unchanged?',
          type: 'NAT',
          options: [],
          correctAnswer: '20',
          explanation: 'Let initial price = 100, consumption = 100 => exp = 10000. New price = 125. New consumption = 10000 / 125 = 80. Reduction = 20%.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following statements about Quick Sort are correct? Select all that apply.',
          type: 'MSQ',
          options: [
            'Worst-case time complexity is O(n^2)',
            'Average-case time complexity is O(n log n)',
            'It is a stable sorting algorithm',
            'It is an in-place sorting algorithm'
          ],
          correctAnswer: '0,1,3',
          explanation: 'Quick Sort has worst-case time O(n^2), average O(n log n). It is an in-place algorithm, but it is unstable because elements are swapped out of order.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following statements about paging are correct? Select all that apply.',
          type: 'MSQ',
          options: [
            'Paging avoids external fragmentation',
            'Paging avoids internal fragmentation',
            'Page table is stored in main memory',
            'TLB cache hit reduces memory access time'
          ],
          correctAnswer: '0,2,3',
          explanation: 'Paging avoids external fragmentation by allocating fixed-size pages. It can lead to internal fragmentation in the last page frame. The page table is stored in main memory, and TLB speeds up lookup.',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else if (normCode.includes('2023')) {
      questionsData = [
        {
          text: 'The determinant of a skew-symmetric matrix of odd order is always:',
          type: 'MCQ',
          options: ['1', '-1', '0', 'Any real number'],
          correctAnswer: '2',
          explanation: 'For any skew-symmetric matrix A of odd order n: det(A) = det(A^T) = det(-A) = (-1)^n * det(A) = -det(A) => 2*det(A) = 0 => det(A) = 0.',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'Let the probability density function of a continuous random variable X be f(x) = k*x for 0 <= x <= 2, and 0 otherwise. What is the value of k?',
          type: 'NAT',
          options: [],
          correctAnswer: '0.5',
          explanation: 'Integral from 0 to 2 of f(x) dx = 1 => k * [x^2/2] from 0 to 2 = k * 2 = 1 => k = 0.5.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Fill in the blank: The corporate merger was handled with great ______ by the CEO.',
          type: 'MCQ',
          options: ['Finesse', 'Apathy', 'Neglect', 'Clumsiness'],
          correctAnswer: '0',
          explanation: 'Finesse means impressive delicacy and skill, which fits handling a complex corporate merger successfully.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'Two trains of length 150m and 100m are running in opposite directions at 45 km/h and 45 km/h respectively. How many seconds will they take to cross each other?',
          type: 'NAT',
          options: [],
          correctAnswer: '10',
          explanation: 'Total distance = 150m + 100m = 250m. Relative speed in opposite direction = 45 + 45 = 90 km/h = 90 * 5/18 = 25 m/s. Time = 250 / 25 = 10 seconds.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following are greedy algorithms? Select all that apply.',
          type: 'MSQ',
          options: [
            'Kruskal\'s MST algorithm',
            'Prim\'s MST algorithm',
            'Dijkstra\'s shortest path algorithm',
            'Floyd-Warshall all-pairs shortest path algorithm'
          ],
          correctAnswer: '0,1,2',
          explanation: 'Kruskal, Prim, and Dijkstra are all classic examples of greedy design. Floyd-Warshall uses dynamic programming.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following CPU scheduling algorithms can lead to starvation? Select all that apply.',
          type: 'MSQ',
          options: [
            'Round Robin',
            'Shortest Remaining Time First (SRTF)',
            'First-Come First-Served',
            'Priority Scheduling (non-preemptive)'
          ],
          correctAnswer: '1,3',
          explanation: 'SRTF can starve long processes if short processes keep arriving. Priority scheduling can starve low-priority processes. RR and FCFS guarantee CPU time to all processes.',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else if (normCode.includes('2022')) {
      questionsData = [
        {
          text: 'Let A and B be two square matrices of order n. If det(A) = 3 and det(B) = 4, then det(2AB) for n=2 is:',
          type: 'MCQ',
          options: ['24', '48', '12', '96'],
          correctAnswer: '1',
          explanation: 'det(k * M) = k^n * det(M). Here det(2AB) = 2^2 * det(A) * det(B) = 4 * 3 * 4 = 48.',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'A fair die is rolled twice. What is the probability that the sum of the numbers obtained is 10? (Round to 3 decimal places)',
          type: 'NAT',
          options: [],
          correctAnswer: '0.083',
          explanation: 'Total sample space = 36. Favorable outcomes for sum 10: {(4,6), (5,5), (6,4)} (3 outcomes). P(Sum 10) = 3/36 = 1/12 ≈ 0.083.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Which word is the closest antonym to: OBSEQUIOUS',
          type: 'MCQ',
          options: ['Domineering', 'Servile', 'Compliant', 'Submissive'],
          correctAnswer: '0',
          explanation: 'Obsequious means obedient or attentive to an excessive or servile degree. Domineering (asserting one\'s will over another in an arrogant way) is the opposite.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'If x:y = 3:4 and y:z = 8:9, then what is x:z? (Enter as a decimal rounded to 3 places)',
          type: 'NAT',
          options: [],
          correctAnswer: '0.667',
          explanation: 'x/z = (x/y) * (y/z) = (3/4) * (8/9) = 24/36 = 2/3 ≈ 0.667.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following graph traversals can check if a graph contains cycles? Select all that apply.',
          type: 'MSQ',
          options: [
            'Depth-First Search (DFS)',
            'Breadth-First Search (BFS)',
            'Inorder Traversal',
            'Preorder Traversal'
          ],
          correctAnswer: '0,1',
          explanation: 'DFS (using back edges) and BFS (using cross edges in undirected graphs) can detect cycles. Inorder and preorder traversals are specific to binary trees, which are acyclic.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following are necessary conditions for deadlock? Select all that apply.',
          type: 'MSQ',
          options: [
            'Mutual Exclusion',
            'Hold and Wait',
            'No Preemption',
            'Circular Wait'
          ],
          correctAnswer: '0,1,2,3',
          explanation: 'All four are the Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Deadlock can occur only if all four hold simultaneously.',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else if (normCode.includes('2021')) {
      questionsData = [
        {
          text: 'The trace of a 3x3 matrix with eigenvalues -1, 0, and 2 is:',
          type: 'MCQ',
          options: ['-1', '0', '1', '2'],
          correctAnswer: '2',
          explanation: 'The trace of a matrix is the sum of its eigenvalues. So Trace = -1 + 0 + 2 = 1 (which is option index 2).',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'If P(A) = 0.6, P(B) = 0.4 and P(A ∩ B) = 0.2, then what is the conditional probability P(A|B)? (Round to 2 decimal places)',
          type: 'NAT',
          options: [],
          correctAnswer: '0.5',
          explanation: 'P(A|B) = P(A ∩ B) / P(B) = 0.2 / 0.4 = 0.5.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Find the word that best completes the sentence: The speaker\'s arguments were so ______ that the audience was completely convinced.',
          type: 'MCQ',
          options: ['Cogent', 'Spurious', 'Weak', 'Superficial'],
          correctAnswer: '0',
          explanation: 'Cogent means clear, logical, and convincing.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'A sum of money doubles itself in 10 years at simple interest. What is the annual rate of interest in percentage?',
          type: 'NAT',
          options: [],
          correctAnswer: '10',
          explanation: 'A sum doubles when Simple Interest (SI) equals the Principal (P). SI = P * R * T / 100 => P = P * R * 10 / 100 => R = 10%.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following data structures can be used to implement a priority queue? Select all that apply.',
          type: 'MSQ',
          options: [
            'Binary Heap',
            'Balanced Binary Search Tree',
            'Unsorted Array',
            'Singly Linked List'
          ],
          correctAnswer: '0,1,2,3',
          explanation: 'All of these can implement a priority queue, though with different time complexities. Heaps are O(log n), BSTs are O(log n), unsorted arrays and lists are O(1) insert but O(n) remove-min.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following statements about virtual memory are correct? Select all that apply.',
          type: 'MSQ',
          options: [
            'It allows execution of processes larger than physical memory',
            'It decreases external fragmentation',
            'It relies on page replacement algorithms',
            'It completely eliminates page faults'
          ],
          correctAnswer: '0,1,2',
          explanation: 'Virtual memory allows executing large processes, uses page tables to eliminate external fragmentation, and relies on page replacement. It does not eliminate page faults, but manages them.',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else if (normCode.includes('2020')) {
      questionsData = [
        {
          text: 'Let A be an n x n identity matrix. The rank of matrix A is:',
          type: 'MCQ',
          options: ['0', '1', 'n', 'n-1'],
          correctAnswer: '2',
          explanation: 'An identity matrix of order n has n linearly independent rows, so its rank is n.',
          subjectId: subMath.id,
          topicId: topicLinear.id
        },
        {
          text: 'A bag contains 4 white and 6 black balls. Three balls are drawn at random. What is the probability that all three are black? (Round to 3 decimal places)',
          type: 'NAT',
          options: [],
          correctAnswer: '0.167',
          explanation: 'P(All 3 Black) = (6/10) * (5/9) * (4/8) = 120 / 720 = 1/6 ≈ 0.167.',
          subjectId: subMath.id,
          topicId: topicProbability.id
        },
        {
          text: 'Identify the synonym for: CAPRICIOUS',
          type: 'MCQ',
          options: ['Fickle', 'Stable', 'Predictable', 'Constant'],
          correctAnswer: '0',
          explanation: 'Capricious means given to sudden and unaccountable changes of mood or behavior. Fickle is a synonym.',
          subjectId: subGA.id,
          topicId: topicVerbal.id
        },
        {
          text: 'By selling a watch for $144, a man loses 10%. At what price should he sell it to gain 10%?',
          type: 'NAT',
          options: [],
          correctAnswer: '176',
          explanation: 'Selling price = 144 represents 90% of Cost Price. CP = 144 / 0.9 = 160. To gain 10%, new SP = 160 * 1.1 = 176.',
          subjectId: subGA.id,
          topicId: topicQuant.id
        },
        {
          text: 'Which of the following are topological sorting orders for a DAG with vertices A, B, C and edges A->B, A->C, B->C? Select all that apply.',
          type: 'MSQ',
          options: [
            'A, B, C',
            'A, C, B',
            'B, A, C',
            'C, B, A'
          ],
          correctAnswer: '0',
          explanation: 'The edges require A before B and C, and B before C. So the only valid ordering is A, B, C.',
          subjectId: subCore.id,
          topicId: topicAlgo.id
        },
        {
          text: 'Which of the following are shared between parent and child processes immediately after a fork() system call in Linux? Select all that apply.',
          type: 'MSQ',
          options: [
            'Open file descriptors',
            'Heap memory content',
            'Process ID',
            'Shared memory segments'
          ],
          correctAnswer: '0,3',
          explanation: 'After fork(), parent and child processes share open file descriptors and shared memory segments. However, the PID is unique to each process, and heap/stack memory is duplicated (using copy-on-write).',
          subjectId: subCore.id,
          topicId: topicOS.id
        }
      ];
    } else {
      // Default / GATE CS 2026 fallback
      questionsData = [
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
    }

    for (const q of questionsData) {
      await prisma.question.create({
        data: q
      });
    }
  }
}
