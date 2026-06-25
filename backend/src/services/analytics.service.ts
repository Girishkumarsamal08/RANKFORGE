import prisma from '../config/db';
import redisClient from '../config/redis';
import axios from 'axios';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const CACHE_TTL = 300; // Cache dashboard analytics for 5 minutes

export class AnalyticsService {
  async getDashboardData(userId: string) {
    const cacheKey = `dashboard:${userId}`;

    // 1. Try to read from Redis cache
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Serving analytics dashboard from cache for user: ${userId}`);
        return JSON.parse(cachedData);
      }
    } catch (err: any) {
      console.warn('Redis read failed, querying DB directly:', err.message);
    }

    // 2. Fetch completed/submitted attempts from database
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: {
          in: ['COMPLETED', 'SUBMITTED']
        }
      },
      include: {
        userAnswers: {
          include: {
            question: {
              include: {
                subject: true,
                topic: true
              }
            }
          }
        },
        exam: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    if (attempts.length === 0) {
      return {
        hasAttempts: false,
        stats: {
          totalTests: 0,
          avgScore: 0,
          maxScore: 0,
          currentRank: null
        },
        recentScores: [],
        weakTopics: [],
        recommendations: [
          'Take your first Mock Test to generate personalized AI performance analytics!',
          'Review the syllabus guidelines in the Resource Hub to kickstart your preparation.'
        ]
      };
    }

    // 3. Aggregate statistics
    const totalTests = attempts.length;
    const scores = attempts.map((a: any) => a.score || 0);
    const avgScore = parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / totalTests).toFixed(2));
    const maxScore = Math.max(...scores);
    const currentRank = (attempts[0] as any).rankEstimated; // Latest rank prediction

    const recentScores = attempts.slice(0, 5).map((a: any) => ({
      attemptId: a.id,
      examCode: a.exam.code,
      score: a.score,
      rank: a.rankEstimated,
      date: a.endTime || a.startTime
    }));

    // Gather all question answers to feed into the AI Engine
    const answersPayload: any[] = [];
    attempts.forEach((attempt: any) => {
      attempt.userAnswers.forEach((ua: any) => {
        answersPayload.push({
          subject: ua.question.subject.name,
          topic: ua.question.topic.name,
          is_correct: ua.isCorrect,
          time_spent_seconds: ua.timeSpentSeconds
        });
      });
    });

    // 4. Query FastAPI AI Engine for Weak Topics and Recommendations
    let aiAnalysis: { weak_topics: any[]; recommendations: string[] } = { weak_topics: [], recommendations: [] };
    try {
      const response = await axios.post(`${AI_ENGINE_URL}/api/weak-topics`, {
        branch: attempts[0].exam.code.split('-')[1]?.toUpperCase() || 'CS',
        answers: answersPayload
      }, { timeout: 3000 });
      aiAnalysis = response.data;
    } catch (err: any) {
      console.error('Failed to get weak topics from AI engine, generating fallback:', err.message);
      // Fallback aggregations
      const fallbackTopics = this.calculateLocalWeakTopics(answersPayload);
      aiAnalysis = {
        weak_topics: fallbackTopics,
        recommendations: [
          'Complete secondary analysis on engineering mathematics formulas.',
          'Focus on previous year questions (PYQs) where solving time exceeds 3 minutes.'
        ]
      };
    }

    const dashboardResult = {
      hasAttempts: true,
      stats: {
        totalTests,
        avgScore,
        maxScore,
        currentRank
      },
      recentScores,
      weakTopics: aiAnalysis.weak_topics,
      recommendations: aiAnalysis.recommendations
    };

    // 5. Cache the aggregated result in Redis
    try {
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(dashboardResult));
    } catch (err: any) {
      console.warn('Redis write failed, analytics not cached:', err.message);
    }

    return dashboardResult;
  }

  private calculateLocalWeakTopics(answers: any[]): any[] {
    const acc: Record<string, { subject: string; topic: string; correct: number; total: number; time: number }> = {};
    for (const a of answers) {
      const key = `${a.subject}:${a.topic}`;
      if (!acc[key]) {
        acc[key] = { subject: a.subject, topic: a.topic, correct: 0, total: 0, time: 0 };
      }
      acc[key].total += 1;
      if (a.is_correct) acc[key].correct += 1;
      acc[key].time += a.time_spent_seconds;
    }

    return Object.values(acc).map(val => {
      const accuracy = val.correct / val.total;
      return {
        subject: val.subject,
        topic: val.topic,
        accuracy: round(accuracy, 2),
        average_time_seconds: round(val.time / val.total, 1),
        recommendation_priority: accuracy < 0.6 ? 'HIGH' : accuracy < 0.8 ? 'MEDIUM' : 'LOW'
      };
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = (priorityOrder[b.recommendation_priority] || 0) - (priorityOrder[a.recommendation_priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.accuracy - b.accuracy;
    });
  }

  async getCollegeRecommendations(userId: string, query: string) {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: {
          in: ['COMPLETED', 'SUBMITTED']
        }
      },
      include: {
        exam: true
      }
    });

    if (attempts.length === 0) {
      return {
        recommendation: "### 🤖 AI College Admissions Advisor\n\nYou haven't completed any mock tests yet! Please attempt at least one GATE mock test from your dashboard so that I can evaluate your performance score, determine your stream (CS, ME, EC, etc.), and provide personalized college recommendations for you."
      };
    }

    const scores = attempts.map((a: any) => a.score || 0);
    const avgScore = parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / attempts.length).toFixed(2));
    const branch = attempts[0].exam.code.split('-')[1]?.toUpperCase() || 'CS';

    try {
      const response = await axios.post(`${AI_ENGINE_URL}/api/college/recommend`, {
        score: avgScore,
        branch,
        query
      }, { timeout: 5000 });
      return response.data;
    } catch (err: any) {
      console.error('Failed to contact AI Engine for college advisor:', err.message);
      return {
        recommendation: "### 🤖 AI College Admissions Advisor\n\nI encountered an error querying the AI Engine. Please make sure the AI Engine service is online, then try again."
      };
    }
  }
}

function round(val: number, precision: number): number {
  const mult = Math.pow(10, precision);
  return Math.round(val * mult) / mult;
}
