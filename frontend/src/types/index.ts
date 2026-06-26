export interface User {
  id: string;
  email: string;
  name: string;
  branch: string;
  profilePicture?: string;
}

export interface Exam {
  id: string;
  title: string;
  code: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'MSQ' | 'NAT';
  options: string[];
  subject: string;
  topic: string;
}

export interface UserAnswer {
  questionId: string;
  answerSelected: string;
  timeSpentSeconds: number;
}

export interface AntiCheatLog {
  eventType: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'FOCUS_LOST';
  details?: string;
  timestamp?: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  examId: string;
  score: number | null;
  rankEstimated: number | null;
  percentile: number | null;
  credibilityScore: number;
  violationsCount: number;
  durationSeconds: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'SUBMITTED';
  startTime: string;
  endTime: string | null;
  exam?: Exam;
}

export interface TopicAccuracy {
  subject: string;
  topic: string;
  accuracy: number;
  average_time_seconds: number;
  recommendation_priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DashboardStats {
  totalTests: number;
  avgScore: number;
  maxScore: number;
  currentRank: number | null;
}

export interface DashboardAnalytics {
  hasAttempts: boolean;
  stats: DashboardStats;
  recentScores: Array<{
    attemptId: string;
    examCode: string;
    score: number;
    rank: number;
    date: string;
  }>;
  weakTopics: TopicAccuracy[];
  recommendations: string[];
}
