import { TestRepository } from '../repositories/test.repository';
import prisma from '../config/db';
import axios from 'axios';
import redisClient from '../config/redis';

const testRepository = new TestRepository();
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

const BRANCH_SUBJECT_TOPICS: Record<string, { subject: string; topics: string[] }> = {
  AE: { subject: 'Aerospace Engineering', topics: ['Aerodynamics', 'Flight Mechanics', 'Space Dynamics', 'Propulsion', 'Aerospace Structures'] },
  AG: { subject: 'Agricultural Engineering', topics: ['Farm Machinery', 'Soil and Water Conservation', 'Agricultural Processing', 'Hydrology'] },
  AR: { subject: 'Architecture and Planning', topics: ['Architecture Design', 'Building Materials', 'Urban Planning', 'Housing & Infrastructure'] },
  BM: { subject: 'Biomedical Engineering', topics: ['Biomedical Instrumentation', 'Biomaterials', 'Biomechanics', 'Medical Imaging Systems'] },
  BT: { subject: 'Biotechnology', topics: ['Recombinant DNA Technology', 'Bioinformatics', 'Bioprocess Engineering', 'Microbiology'] },
  CE: { subject: 'Core Civil Engineering', topics: ['Structural Engineering', 'Geotechnical Engineering', 'Water Resources', 'Environmental Engineering', 'Transportation'] },
  CH: { subject: 'Chemical Engineering', topics: ['Process Calculations', 'Fluid Mechanics & Mechanical Operations', 'Heat Transfer', 'Mass Transfer', 'Chemical Reaction Engineering'] },
  CS: { subject: 'Core Computer Science', topics: ['Programming & Data Structures', 'Algorithms', 'Theory of Computation', 'Compiler Design', 'Operating Systems', 'Databases', 'Computer Networks', 'Computer Organization & Architecture', 'Digital Logic'] },
  DA: { subject: 'Data Science & AI', topics: ['Probability and Statistics', 'Linear Algebra', 'Calculus and Optimization', 'Programming, DS and Algorithms', 'Databases', 'Machine Learning', 'Artificial Intelligence'] },
  EC: { subject: 'Core Electronics & Communication', topics: ['Network Theory', 'Signals & Systems', 'Electronic Devices', 'Analog Circuits', 'Digital Circuits', 'Control Systems', 'Communications', 'Electromagnetics'] },
  EE: { subject: 'Electrical Engineering', topics: ['Electric Circuits', 'Electromagnetic Fields', 'Signals & Systems', 'Electrical Machines', 'Power Systems', 'Control Systems', 'Power Electronics'] },
  ES: { subject: 'Environmental Science', topics: ['Environmental Chemistry', 'Environmental Microbiology', 'Water Supply & Wastewater', 'Solid Waste Management', 'Air & Noise Pollution'] },
  EY: { subject: 'Ecology and Evolution', topics: ['Ecology', 'Evolutionary Biology', 'Behavioral Ecology', 'Systematics & Biogeography'] },
  GE: { subject: 'Geomatics Engineering', topics: ['Remote Sensing', 'GIS', 'GPS & GNSS', 'Surveying & Photogrammetry'] },
  GG: { subject: 'Geology and Geophysics', topics: ['Earth and Planetary System', 'Geology', 'Geophysics', 'Structural Geology', 'Seismology'] },
  IN: { subject: 'Instrumentation Engineering', topics: ['Sensors & Industrial Instrumentation', 'Optical Instrumentation', 'Signals & Systems', 'Control Systems', 'Measurements'] },
  MA: { subject: 'Mathematics', topics: ['Algebra', 'Real Analysis', 'Complex Analysis', 'Functional Analysis', 'Numerical Analysis'] },
  ME: { subject: 'Mechanical Engineering', topics: ['Applied Mechanics & Design', 'Fluid Mechanics & Thermal Sciences', 'Manufacturing & Industrial Engineering'] },
  MN: { subject: 'Mining Engineering', topics: ['Mine Development & Surveying', 'Geomechanics & Ground Control', 'Mining Methods & Systems', 'Mine Ventilation'] },
  MT: { subject: 'Metallurgical Engineering', topics: ['Thermodynamics & Kinetics', 'Physical Metallurgy', 'Mechanical Metallurgy', 'Extraction Metallurgy'] },
  NM: { subject: 'Naval Architecture', topics: ['Ship Design', 'Hydrostatics & Stability', 'Ship Structures', 'Ship Resistance & Propulsion'] },
  PE: { subject: 'Petroleum Engineering', topics: ['Petroleum Exploration', 'Drilling Engineering', 'Production Operations', 'Reservoir Engineering'] },
  PH: { subject: 'Physics', topics: ['Mathematical Physics', 'Classical Mechanics', 'Electromagnetic Theory', 'Quantum Mechanics', 'Thermodynamics & Statistical Physics'] },
  PI: { subject: 'Production & Industrial Engineering', topics: ['General Engineering', 'Manufacturing Processes', 'Operational Research', 'Quality & Reliability'] },
  ST: { subject: 'Statistics', topics: ['Probability', 'Stochastic Processes', 'Statistical Inference', 'Multivariate Analysis', 'Regression Analysis'] },
  TF: { subject: 'Textile Engineering', topics: ['Textile Fibres', 'Yarn Manufacture', 'Fabric Manufacture', 'Chemical Processing of Textiles'] },
  XE: { subject: 'Engineering Sciences', topics: ['Fluid Mechanics', 'Materials Science', 'Solid Mechanics', 'Thermodynamics'] },
  XH: { subject: 'Humanities & Social Sciences', topics: ['Economics', 'English Linguistics', 'Philosophy', 'Psychology', 'Sociology'] },
  XL: { subject: 'Life Sciences', topics: ['Biochemistry', 'Botany', 'Microbiology', 'Zoology', 'Food Technology'] },
};

export class TestService {
  async startTest(userId: string, examCode: string) {
    // 1. Redis active session locking check
    const activeAttemptId = await redisClient.get(`user:${userId}:active_attempt`);
    if (activeAttemptId) {
      throw new Error('You already have an active test session running');
    }

    // 2. Parse examCode to identify year and mode
    // Expected format: gate-cs-[year]-[mode], e.g. gate-cs-2025-ga, gate-cs-2025-subject, gate-cs-2025-full
    const parts = examCode.split('-');
    const year = parts[2] || '2025';
    const mode = parts[3] || 'full'; // 'ga', 'subject', 'full'

    // Determine exam duration and custom title
    let durationSeconds = 10800; // default 180 mins for full
    let modeText = 'Full Mock Exam';
    if (mode === 'ga') {
      durationSeconds = 1800; // 30 mins
      modeText = 'General Aptitude';
    } else if (mode === 'subject') {
      durationSeconds = 9000; // 150 mins
      modeText = 'Subject Paper';
    }

    const branch = parts[1] || 'cs';
    const branchUpper = branch.toUpperCase();
    const examTitle = `GATE ${branchUpper} ${year} - ${modeText}`;
    const exam = await testRepository.getFirstOrCreateExam(examCode, examTitle);

    // 3. Check if we need to seed starter questions for this exam
    const existingQuestions = await testRepository.getQuestionsByExam(exam.id);
    if (existingQuestions.length === 0) {
      await this.seedExamData(exam.id, examCode);
    }

    // 4. Create test attempt with duration
    const attempt = await testRepository.createAttempt(userId, exam.id, durationSeconds);

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
        marks: (q as any).marks || 2.0,
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

        const marks = (q as any).marks || 2.0;
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
      const maxPossibleScore = dbQuestions.reduce((acc, q) => acc + ((q as any).marks || 2.0), 0);
      const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
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
    const parts = (examCode || '').toLowerCase().split('-');
    const branch = parts[1] || 'cs';
    const branchUpper = branch.toUpperCase();
    const year = parts[2] || '2025';
    const mode = parts[3] || 'full';

    console.log(`Auto-seeding questions for exam identifier: ${examId}, branch: ${branchUpper}, year: ${year}, mode: ${mode}`);
    
    // Create subjects
    const subGA = await prisma.subject.create({ data: { name: 'General Aptitude', examId } });
    const subMath = await prisma.subject.create({ data: { name: 'Engineering Mathematics', examId } });
    const subCoreName = BRANCH_SUBJECT_TOPICS[branchUpper]?.subject || `Core ${branchUpper}`;
    const subCore = await prisma.subject.create({ data: { name: subCoreName, examId } });

    // Create GA topics
    const topicVerbal = await prisma.topic.create({ data: { name: 'Verbal Aptitude', subjectId: subGA.id } });
    const topicQuant = await prisma.topic.create({ data: { name: 'Quantitative Aptitude', subjectId: subGA.id } });
    const topicAnalytical = await prisma.topic.create({ data: { name: 'Analytical Aptitude', subjectId: subGA.id } });
    const topicSpatial = await prisma.topic.create({ data: { name: 'Spatial Aptitude', subjectId: subGA.id } });

    // Create Math topics
    const topicLinear = await prisma.topic.create({ data: { name: 'Linear Algebra', subjectId: subMath.id } });
    const topicProbability = await prisma.topic.create({ data: { name: 'Probability & Statistics', subjectId: subMath.id } });
    const topicCalculus = await prisma.topic.create({ data: { name: 'Calculus', subjectId: subMath.id } });
    const topicDiscrete = await prisma.topic.create({ data: { name: 'Discrete Mathematics', subjectId: subMath.id } });

    // Create Core topics
    const coreTopicsList = BRANCH_SUBJECT_TOPICS[branchUpper]?.topics || ['Core Principles', 'Core Design', 'Core Applications'];
    const seededCoreTopics: any[] = [];
    const coreTopicMap: Record<string, string> = {};
    for (const tName of coreTopicsList) {
      const tObj = await prisma.topic.create({ data: { name: tName, subjectId: subCore.id } });
      seededCoreTopics.push(tObj);
      coreTopicMap[tName] = tObj.id;
    }

    const gaQuestionsData = [
      {
        text: 'Select the word closest in meaning to: PRAGMATIC',
        type: 'MCQ',
        options: ['Practical', 'Idealistic', 'Dreamy', 'Vague'],
        correctAnswer: '0',
        explanation: 'Pragmatic means dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
        marks: 1.0,
        subjectId: subGA.id,
        topicId: topicVerbal.id
      },
      {
        text: 'Fill in the blank: The corporate merger was handled with great ______ by the CEO.',
        type: 'MCQ',
        options: ['Finesse', 'Apathy', 'Neglect', 'Clumsiness'],
        correctAnswer: '0',
        explanation: 'Finesse means impressive delicacy and skill, which fits handling a complex corporate merger successfully.',
        marks: 1.0,
        subjectId: subGA.id,
        topicId: topicVerbal.id
      },
      {
        text: 'A work can be completed by 10 men in 15 days. How many days will it take for 15 men to complete the same work?',
        type: 'NAT',
        options: [],
        correctAnswer: '10',
        explanation: 'Total man-days required = 10 * 15 = 150. For 15 men, days required = 150 / 15 = 10 days.',
        marks: 1.0,
        subjectId: subGA.id,
        topicId: topicQuant.id
      },
      {
        text: 'If log(x) + log(y) = log(x + y) for positive real numbers, which of the following expressions is correct?',
        type: 'MCQ',
        options: ['x = y', 'y = x / (x - 1)', 'x = y / (y - 1)', 'y = x / (x + 1)'],
        correctAnswer: '1',
        explanation: 'log(x) + log(y) = log(xy) => xy = x + y => y(x - 1) = x => y = x / (x - 1).',
        marks: 1.0,
        subjectId: subGA.id,
        topicId: topicQuant.id
      },
      {
        text: 'Which of the following sentences contain grammatical errors? Select all that apply.',
        type: 'MSQ',
        options: [
          'He don\'t know the answer.',
          'She plays the piano beautifully.',
          'Each of the students have submitted the assignment.',
          'None of the above'
        ],
        correctAnswer: '0,2',
        explanation: '"He don\'t" should be "He doesn\'t", and "Each... have" should be "Each... has" because "Each" is singular.',
        marks: 1.0,
        subjectId: subGA.id,
        topicId: topicVerbal.id
      },
      {
        text: 'Two trains of length 150m and 100m are running in opposite directions at 45 km/h each. How many seconds will they take to cross each other?',
        type: 'NAT',
        options: [],
        correctAnswer: '10',
        explanation: 'Total distance = 150m + 100m = 250m. Relative speed in opposite direction = 45 + 45 = 90 km/h = 90 * 5/18 = 25 m/s. Time = 250 / 25 = 10 seconds.',
        marks: 2.0,
        subjectId: subGA.id,
        topicId: topicQuant.id
      },
      {
        text: 'A fair die is rolled twice. What is the probability that the sum of the numbers obtained is 10? (Round to 3 decimal places)',
        type: 'NAT',
        options: [],
        correctAnswer: '0.083',
        explanation: 'Total sample space = 36. Favorable outcomes for sum 10: {(4,6), (5,5), (6,4)} (3 outcomes). P(Sum 10) = 3/36 = 1/12 ≈ 0.083.',
        marks: 2.0,
        subjectId: subGA.id,
        topicId: topicAnalytical.id
      },
      {
        text: 'A cube of side 4cm is painted red on all faces. It is cut into 1cm cubes. How many small cubes will have exactly 2 faces painted?',
        type: 'NAT',
        options: [],
        correctAnswer: '24',
        explanation: 'Cubes with exactly 2 faces painted are found on the edges, excluding the corners. A cube has 12 edges. For a 4x4x4 cube, each edge has 4 - 2 = 2 such cubes. Total = 12 * 2 = 24.',
        marks: 2.0,
        subjectId: subGA.id,
        topicId: topicSpatial.id
      },
      {
        text: 'Find the missing term in the series: 2, 6, 12, 20, 30, ___',
        type: 'MCQ',
        options: ['36', '40', '42', '48'],
        correctAnswer: '2',
        explanation: 'The differences between consecutive terms are 4, 6, 8, 10... The next difference is 12. So, 30 + 12 = 42.',
        marks: 2.0,
        subjectId: subGA.id,
        topicId: topicAnalytical.id
      },
      {
        text: 'A shopkeeper sells an item at a profit of 20%. If he had bought it for 10% less and sold it for $18 more, he would have gained 40%. What is the cost price of the item?',
        type: 'MCQ',
        options: ['300', '400', '500', '600'],
        correctAnswer: '0',
        explanation: 'Let CP = x. SP = 1.2x. New CP = 0.9x. New SP = 1.2x + 18. Gain = 40% => 1.2x + 18 = 1.4 * 0.9x = 1.26x => 0.06x = 18 => x = 300.',
        marks: 2.0,
        subjectId: subGA.id,
        topicId: topicQuant.id
      }
    ];

    const mathQuestionsData = [
      {
        text: 'Consider a 3x3 matrix A with eigenvalues 1, 2, and 5. What is the determinant of matrix A^2?',
        type: 'MCQ',
        options: ['8', '10', '20', '100'],
        correctAnswer: '3',
        explanation: 'The determinant of a matrix is the product of its eigenvalues. So det(A) = 1 * 2 * 5 = 10. Thus, det(A^2) = (det(A))^2 = 10^2 = 100.',
        marks: 1.0,
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'The determinant of a skew-symmetric matrix of odd order is always:',
        type: 'MCQ',
        options: ['1', '-1', '0', 'Any real number'],
        correctAnswer: '2',
        explanation: 'For any skew-symmetric matrix A of odd order n: det(A) = det(A^T) = det(-A) = (-1)^n * det(A) = -det(A) => 2*det(A) = 0 => det(A) = 0.',
        marks: 1.0,
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'What is the trace of a 3x3 matrix with eigenvalues -1, 0, and 2?',
        type: 'MCQ',
        options: ['-1', '0', '1', '2'],
        correctAnswer: '2',
        explanation: 'The trace of a matrix is the sum of its eigenvalues. So Trace = -1 + 0 + 2 = 1 (which is option index 2).',
        marks: 1.0,
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'Let A be an n x n identity matrix. The rank of matrix A is:',
        type: 'MCQ',
        options: ['0', '1', 'n', 'n-1'],
        correctAnswer: '2',
        explanation: 'An identity matrix of order n has n linearly independent rows, so its rank is n.',
        marks: 1.0,
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'If A is a 2x2 real matrix such that A + A^T = 0, which of the following is true?',
        type: 'MCQ',
        options: ['A is symmetric', 'A is skew-symmetric', 'A is identity', 'A is invertible'],
        correctAnswer: '1',
        explanation: 'A matrix A that satisfies A^T = -A (or A + A^T = 0) is skew-symmetric.',
        marks: 1.0,
        subjectId: subMath.id,
        topicId: topicLinear.id
      },
      {
        text: 'Let the probability density function of a continuous random variable X be f(x) = k*x for 0 <= x <= 2, and 0 otherwise. What is the value of k?',
        type: 'NAT',
        options: [],
        correctAnswer: '0.5',
        explanation: 'Integral from 0 to 2 of f(x) dx = 1 => k * [x^2/2] from 0 to 2 = k * 2 = 1 => k = 0.5.',
        marks: 2.0,
        subjectId: subMath.id,
        topicId: topicProbability.id
      },
      {
        text: 'If P(A) = 0.6, P(B) = 0.4 and P(A ∩ B) = 0.2, then what is the conditional probability P(A|B)? (Round to 2 decimal places)',
        type: 'NAT',
        options: [],
        correctAnswer: '0.5',
        explanation: 'P(A|B) = P(A ∩ B) / P(B) = 0.2 / 0.4 = 0.5.',
        marks: 2.0,
        subjectId: subMath.id,
        topicId: topicProbability.id
      },
      {
        text: 'A bag contains 4 white and 6 black balls. Three balls are drawn at random. What is the probability that all three are black? (Round to 3 decimal places)',
        type: 'NAT',
        options: [],
        correctAnswer: '0.167',
        explanation: 'P(All 3 Black) = (6/10) * (5/9) * (4/8) = 120 / 720 = 1/6 ≈ 0.167.',
        marks: 2.0,
        subjectId: subMath.id,
        topicId: topicProbability.id
      },
      {
        text: 'A coin is tossed 3 times. What is the probability of getting exactly 2 heads? (Round to 3 decimal places)',
        type: 'NAT',
        options: [],
        correctAnswer: '0.375',
        explanation: 'Possible outcomes are 2^3 = 8. Outcomes with exactly 2 heads are {HHT, HTH, THH} (3 outcomes). P(exactly 2 H) = 3/8 = 0.375.',
        marks: 2.0,
        subjectId: subMath.id,
        topicId: topicProbability.id
      },
      {
        text: 'Let G be a simple undirected graph with 10 vertices. What is the maximum number of edges G can have without containing any cycles?',
        type: 'NAT',
        options: [],
        correctAnswer: '9',
        explanation: 'A graph without cycles is a forest. The maximum edges in a forest with n vertices is n - 1. So for 10 vertices, it is 9.',
        marks: 2.0,
        subjectId: subMath.id,
        topicId: topicDiscrete.id
      }
    ];

    let coreQuestionsData: any[] = [];

    if (branchUpper === 'CS') {
      const highFidelityCS = [
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
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Algorithms'] || seededCoreTopics[1].id
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
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Operating Systems'] || seededCoreTopics[4].id
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
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Operating Systems'] || seededCoreTopics[4].id
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
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Algorithms'] || seededCoreTopics[1].id
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
          explanation: 'All of these can implement a priority queue, though with different complexities. Heaps are O(log n), BSTs are O(log n), unsorted arrays and lists are O(1) insert but O(n) remove-min.',
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Algorithms'] || seededCoreTopics[1].id
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
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Operating Systems'] || seededCoreTopics[4].id
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
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Algorithms'] || seededCoreTopics[1].id
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
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Operating Systems'] || seededCoreTopics[4].id
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
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Operating Systems'] || seededCoreTopics[4].id
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
          correctAnswer: '0,2',
          explanation: 'Inorder gives sorted keys. Search in a skewed BST can take O(n) time. The maximum depth of skewed BST is O(n).',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Algorithms'] || seededCoreTopics[1].id
        },
        {
          text: 'Consider a relation R(A, B, C, D) with functional dependencies: A -> B, B -> C, C -> D, D -> A. In which normal form is relation R?',
          type: 'MCQ',
          options: ['1NF but not 2NF', '2NF but not 3NF', '3NF but not BCNF', 'BCNF'],
          correctAnswer: '3',
          explanation: 'The candidate keys of R are A, B, C, and D (since they form a cycle of dependencies). Since all attributes are prime, R is in 3NF. Also, for every functional dependency X -> Y, X is a superkey. Thus R is in BCNF.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Databases'] || seededCoreTopics[5].id
        },
        {
          text: 'A TCP connection is using slow start. The congestion window (cwnd) size is 10 KB when a timeout occurs. What is the new slow start threshold (ssthresh) and cwnd size in KB?',
          type: 'MCQ',
          options: [
            'ssthresh = 5, cwnd = 1',
            'ssthresh = 5, cwnd = 5',
            'ssthresh = 10, cwnd = 1',
            'ssthresh = 10, cwnd = 5'
          ],
          correctAnswer: '0',
          explanation: 'When a timeout occurs, ssthresh is set to half of the current cwnd (10 / 2 = 5 KB) and cwnd is reset to 1 MSS (1 KB).',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Computer Networks'] || seededCoreTopics[6].id
        },
        {
          text: 'What is the maximum number of states in a minimal DFA that accepts the language L = { w in {0,1}* | w contains an even number of 0s and odd number of 1s }?',
          type: 'MCQ',
          options: ['2', '3', '4', '5'],
          correctAnswer: '2',
          explanation: 'We need states to track (parity of 0s, parity of 1s). There are 2 possible states for 0s (even, odd) and 2 for 1s (even, odd). Total states = 2 * 2 = 4.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Theory of Computation'] || seededCoreTopics[2].id
        },
        {
          text: 'Consider a compiler parser grammar. Which of the following grammars is LL(1)?',
          type: 'MCQ',
          options: ['S -> aS | a', 'S -> aS | b', 'S -> aSb | e', 'S -> aS | Sa | b'],
          correctAnswer: '1',
          explanation: 'S -> aS | b has distinct FIRST sets: FIRST(aS) = {a}, FIRST(b) = {b}, which do not overlap. Thus it is LL(1). S -> aS | a has FIRST set overlap ({a}).',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Compiler Design'] || seededCoreTopics[3].id
        },
        {
          text: 'A pipelined processor has 5 stages with delays 9, 12, 7, 10, 8 nanoseconds. What is the clock cycle time in nanoseconds if the pipeline register delay is 1 nanosecond?',
          type: 'MCQ',
          options: ['10', '11', '12', '13'],
          correctAnswer: '3',
          explanation: 'The clock cycle time of a pipeline is determined by the slowest stage delay plus the register delay. Slowest stage = 12ns. Register delay = 1ns. Clock cycle = 12 + 1 = 13ns.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Computer Organization & Architecture'] || seededCoreTopics[7].id
        }
      ];

      coreQuestionsData = [...highFidelityCS];
    } else if (branchUpper === 'EC') {
      const highFidelityEC = [
        {
          text: 'In a series RLC circuit at resonance, the impedance of the circuit is:',
          type: 'MCQ',
          options: ['Zero', 'Minimum and purely resistive', 'Maximum and purely inductive', 'Infinite'],
          correctAnswer: '1',
          explanation: 'At resonance, the inductive reactance and capacitive reactance cancel each other out (XL = XC). The total impedance is Z = R, which is minimum and purely resistive.',
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Network Theory'] || seededCoreTopics[0].id
        },
        {
          text: 'The Fourier transform of a unit impulse function delta(t) is:',
          type: 'MCQ',
          options: ['1', 'delta(f)', 'e^(-j2pi f)', '0'],
          correctAnswer: '0',
          explanation: 'The Fourier transform of delta(t) is the integral of delta(t)*e^(-j2pi f t) dt from -inf to +inf, which evaluates to e^0 = 1.',
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Signals & Systems'] || seededCoreTopics[1].id
        },
        {
          text: 'The depletion region width in a p-n junction diode increases with:',
          type: 'MCQ',
          options: ['Increase in forward bias voltage', 'Increase in reverse bias voltage', 'Increase in doping concentration', 'None of the above'],
          correctAnswer: '1',
          explanation: 'Reverse biasing pulls majority carriers away from the junction, thereby exposing more immobile ions and increasing the depletion region width.',
          marks: 1.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Electronic Devices'] || seededCoreTopics[2].id
        },
        {
          text: 'An ideal operational amplifier is characterized by:',
          type: 'MCQ',
          options: [
            'Infinite input impedance and zero output impedance',
            'Zero input impedance and infinite output impedance',
            'Infinite input impedance and infinite output impedance',
            'Zero input impedance and zero output impedance'
          ],
          correctAnswer: '0',
          explanation: 'An ideal op-amp has infinite input resistance (draws no current) and zero output resistance (can drive any load).',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Analog Circuits'] || seededCoreTopics[3].id
        },
        {
          text: 'Which of the following logic gates is considered a universal logic gate?',
          type: 'MCQ',
          options: ['AND', 'OR', 'NAND', 'XOR'],
          correctAnswer: '2',
          explanation: 'NAND and NOR gates are universal gates because any boolean function can be implemented using only NAND gates or only NOR gates.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Digital Circuits'] || seededCoreTopics[4].id
        },
        {
          text: 'A system has a closed-loop transfer function T(s) = 10 / (s^2 + 3s + 2). The system is:',
          type: 'MCQ',
          options: ['Stable', 'Unstable', 'Marginally stable', 'Critically stable'],
          correctAnswer: '0',
          explanation: 'The poles of the transfer function are the roots of s^2 + 3s + 2 = 0, which are s = -1 and s = -2. Since both poles lie in the left half of the s-plane, the system is stable.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Control Systems'] || seededCoreTopics[5].id
        },
        {
          text: 'In frequency modulation (FM), the frequency deviation of the carrier is proportional to:',
          type: 'MCQ',
          options: ['Amplitude of the modulating signal', 'Frequency of the modulating signal', 'Phase of the modulating signal', 'None of the above'],
          correctAnswer: '0',
          explanation: 'In FM, the instantaneous frequency of the carrier varies linearly with the amplitude of the modulating signal. Thus, the frequency deviation is proportional to the amplitude.',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Communications'] || seededCoreTopics[6].id
        },
        {
          text: 'Maxwell\'s equation curl(H) = J + dD/dt is a statement of:',
          type: 'MCQ',
          options: ['Faraday\'s Law', 'Ampere\'s Law with Maxwell\'s correction', 'Gauss\'s Law', 'Coulomb\'s Law'],
          correctAnswer: '1',
          explanation: 'curl(H) = J + dD/dt is Ampere\'s circuital law modified by Maxwell to include displacement current (dD/dt).',
          marks: 2.0,
          subjectId: subCore.id,
          topicId: coreTopicMap['Electromagnetics'] || seededCoreTopics[7].id
        }
      ];

      coreQuestionsData = [...highFidelityEC];
    }

    // Now populate coreQuestionsData to a total of 45 questions dynamically
    let qIdCounter = coreQuestionsData.length + 1;
    while (coreQuestionsData.length < 45) {
      const topic = seededCoreTopics[coreQuestionsData.length % seededCoreTopics.length];
      const isTwoMark = coreQuestionsData.length >= 20;
      const marks = isTwoMark ? 2.0 : 1.0;

      coreQuestionsData.push({
        text: `[GATE ${branchUpper} ${year} - Q${20 + qIdCounter}] Consider a fundamental design or analysis problem in ${topic.name}. Calculate the optimal state-space model or parameter configurations matching standard boundary settings.`,
        type: 'MCQ',
        options: [
          'Standard steady-state boundary response',
          'Transient parameter convergence limit',
          'Linear parameter matrix eigenvalues representation',
          'Dynamic state feedback stabilization'
        ],
        correctAnswer: '0',
        explanation: `Under standard exam conditions in ${topic.name}, the parameters must be analyzed using steady-state methods to resolve the system's boundary state vector.`,
        marks,
        subjectId: subCore.id,
        topicId: topic.id
      });
      qIdCounter++;
    }

    // Now, filter questions based on the mode and seed
    let finalQuestions: any[] = [];
    if (mode === 'ga') {
      finalQuestions = [...gaQuestionsData];
    } else if (mode === 'subject') {
      mathQuestionsData.forEach((q, idx) => {
        q.marks = idx < 5 ? 1.0 : 2.0;
      });
      coreQuestionsData.forEach((q, idx) => {
        q.marks = idx < 20 ? 1.0 : 2.0;
      });
      finalQuestions = [...mathQuestionsData, ...coreQuestionsData];
    } else {
      gaQuestionsData.forEach((q, idx) => {
        q.marks = idx < 5 ? 1.0 : 2.0;
      });
      mathQuestionsData.forEach((q, idx) => {
        q.marks = idx < 5 ? 1.0 : 2.0;
      });
      coreQuestionsData.forEach((q, idx) => {
        q.marks = idx < 20 ? 1.0 : 2.0;
      });
      finalQuestions = [...gaQuestionsData, ...mathQuestionsData, ...coreQuestionsData];
    }

    for (const q of finalQuestions) {
      await prisma.question.create({
        data: q
      });
    }
    console.log(`Seeding complete. Seeded ${finalQuestions.length} questions for exam ${examId}`);
  }
}
