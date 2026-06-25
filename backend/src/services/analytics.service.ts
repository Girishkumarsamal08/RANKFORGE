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
        recommendation: "### College Admissions Advisor\n\nYou haven't completed any mock tests yet. Please attempt at least one GATE mock test from your dashboard so that your performance score can be evaluated, your stream (CS, ME, EC, etc.) identified, and personalized college recommendations generated for you."
      };
    }

    const scores = attempts.map((a: any) => a.score || 0);
    const avgScore = parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / attempts.length).toFixed(2));
    const branch = attempts[0].exam.code.split('-')[1]?.toUpperCase() || 'CS';

    // Try the AI Engine first; fall back to rule-based recommendations
    try {
      const response = await axios.post(`${AI_ENGINE_URL}/api/college/recommend`, {
        score: avgScore,
        branch,
        query
      }, { timeout: 5000 });
      return response.data;
    } catch (err: any) {
      console.error('AI Engine unavailable, using rule-based college advisor:', err.message);
      return {
        recommendation: this.generateLocalCollegeRecommendation(avgScore, branch, query)
      };
    }
  }

  private generateLocalCollegeRecommendation(avgScore: number, branch: string, query: string): string {
    const estimatedRank = this.scoreToEstimatedRank(avgScore);
    const queryLower = query.toLowerCase();

    let output = `### College Admissions Advisor\n\n`;
    output += `**Your Profile:** Average Score: **${avgScore}%** | Branch: **${branch}** | Estimated AIR: **~${estimatedRank}**\n\n`;

    // Determine which colleges to highlight based on query context
    const wantsIIT = queryLower.includes('iit');
    const wantsNIT = queryLower.includes('nit');
    const wantsIISc = queryLower.includes('iisc');
    const wantsPSU = queryLower.includes('psu');
    const generalQuery = !wantsIIT && !wantsNIT && !wantsIISc && !wantsPSU;

    if (estimatedRank <= 100) {
      output += `#### Top Ranker Category (AIR Under 100)\n\n`;
      output += `With this performance, you are in an excellent position for admissions to the most competitive programs in the country.\n\n`;
      if (generalQuery || wantsIISc) {
        output += `**IISc Bangalore:**\n* IISc M.Tech / M.E. in ${branch} — Strong admit probability. IISc typically admits within AIR 1-200 range for popular branches.\n\n`;
      }
      if (generalQuery || wantsIIT) {
        output += `**Top IITs (Old IITs):**\n* IIT Bombay — ${branch} dept. admits typically under AIR 150\n* IIT Delhi — ${branch} specializations accessible under AIR 200\n* IIT Kanpur — Top ${branch} programs within AIR 250\n* IIT Madras — Highly competitive, admits under AIR 200\n* IIT Kharagpur — Broader intake, strong placement record\n\n`;
      }
      if (generalQuery || wantsPSU) {
        output += `**PSU Opportunities:**\n* IOCL, NTPC, BHEL, PGCIL, ONGC — Direct interview calls for AIR under 100. Expect shortlisting from multiple PSUs.\n\n`;
      }
    } else if (estimatedRank <= 500) {
      output += `#### Elite Category (AIR 100-500)\n\n`;
      output += `You have a strong competitive profile. Several premier institutions are within reach.\n\n`;
      if (generalQuery || wantsIIT) {
        output += `**IITs (Realistic Options):**\n* IIT Bombay — Possible for less-competitive ${branch} specializations\n* IIT Delhi, IIT Kanpur, IIT Madras — Accessible for most ${branch} streams\n* IIT Roorkee, IIT Guwahati, IIT Hyderabad — High probability of admission\n* Newer IITs (Indore, BHU, Ropar, Patna, Gandhinagar) — Confirmed admit range\n\n`;
      }
      if (generalQuery || wantsIISc) {
        output += `**IISc Bangalore:**\n* Possible for certain ${branch} research programs. Cutoff varies by specialization (typically AIR under 300-500).\n\n`;
      }
      if (generalQuery || wantsNIT) {
        output += `**Top NITs:**\n* NIT Trichy, NIT Warangal, NIT Surathkal — Prime ${branch} seats available in this rank range\n\n`;
      }
      if (generalQuery || wantsPSU) {
        output += `**PSU Opportunities:**\n* BARC, ISRO — Interview calls likely for AIR under 500\n* IOCL, NTPC, BHEL — Strong chances of shortlisting\n\n`;
      }
    } else if (estimatedRank <= 2000) {
      output += `#### Qualifying Standard (AIR 500-2000)\n\n`;
      output += `A solid performance level. You have good options across NITs, IIITs, and newer IITs.\n\n`;
      if (generalQuery || wantsIIT) {
        output += `**IITs (Accessible):**\n* Newer IITs (Patna, Ropar, Mandi, Jodhpur, Bhilai, Goa, Palakkad, Dharwad, Tirupati) — Most ${branch} programs are within this AIR range\n* IIT (ISM) Dhanbad — Select specializations\n\n`;
      }
      if (generalQuery || wantsNIT) {
        output += `**NITs (Strong Options):**\n* NIT Trichy, NIT Warangal, NIT Surathkal — Competitive but possible\n* NIT Calicut, NIT Allahabad, NIT Jaipur, NIT Rourkela — High admit probability\n* Most other NITs — Confirmed range for ${branch}\n\n`;
      }
      if (generalQuery) {
        output += `**IIITs and CFTIs:**\n* IIIT Hyderabad, IIIT Bangalore, IIIT Allahabad — Good options for ${branch}\n* DIAT Pune, IIEST Shibpur — Accessible\n\n`;
      }
    } else {
      output += `#### Development Category (AIR 2000+)\n\n`;
      output += `Your current score indicates room for improvement. Focus on strengthening weak areas for better college options.\n\n`;
      if (generalQuery || wantsNIT) {
        output += `**Currently Accessible NITs:**\n* Select NITs with higher AIR cutoffs for ${branch} (NITs in NE region, Uttarakhand, Meghalaya, Mizoram, Sikkim, Arunachal Pradesh)\n\n`;
      }
      if (generalQuery) {
        output += `**Other Options:**\n* State-funded engineering colleges with GATE scores\n* GATE-qualified PSU recruitment (varies by cutoff each year)\n* Several IIITs and centrally-funded technical institutions accept in this range\n\n`;
        output += `**Improvement Strategy:**\n* Re-analyze your weak topics using the Performance Analysis section\n* Practice more PYQs from the GATE PYQ Library\n* Target high-weightage subjects to maximize score improvement\n`;
      }
    }

    output += `\n---\n*Recommendations are based on historical GATE cutoff trends for ${branch}. Actual cutoffs vary each year based on paper difficulty, number of candidates, and seat availability.*`;

    return output;
  }

  private scoreToEstimatedRank(avgScore: number): number {
    // Approximate mapping from percentage score to GATE AIR
    // Based on typical GATE CS score distributions
    if (avgScore >= 75) return Math.max(1, Math.round(50 + (85 - avgScore) * 10));
    if (avgScore >= 60) return Math.round(100 + (75 - avgScore) * 40);
    if (avgScore >= 45) return Math.round(700 + (60 - avgScore) * 150);
    if (avgScore >= 30) return Math.round(3000 + (45 - avgScore) * 400);
    return Math.round(9000 + (30 - avgScore) * 500);
  }
}

function round(val: number, precision: number): number {
  const mult = Math.pow(10, precision);
  return Math.round(val * mult) / mult;
}
