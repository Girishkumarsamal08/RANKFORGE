import prisma from '../config/db';
import { Prisma, Exam, TestAttempt, UserAnswer, AntiCheatLog } from '@prisma/client';

export class TestRepository {
  async getFirstOrCreateExam(code: string, title: string): Promise<Exam> {
    const existing = await prisma.exam.findUnique({ where: { code } });
    if (existing) return existing;

    return prisma.exam.create({
      data: {
        code,
        title,
      },
    });
  }

  async getQuestionsByExam(examId: string) {
    return prisma.question.findMany({
      where: {
        subject: {
          examId
        }
      },
      include: {
        subject: true,
        topic: true
      }
    });
  }

  async createAttempt(userId: string, examId: string, durationSeconds?: number): Promise<TestAttempt> {
    return prisma.testAttempt.create({
      data: {
        userId,
        examId,
        status: 'IN_PROGRESS',
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      },
    });
  }

  async findAttemptById(id: string) {
    return prisma.testAttempt.findUnique({
      where: { id },
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
        antiCheatLogs: true,
        exam: true
      }
    });
  }

  async updateAttempt(id: string, data: Prisma.TestAttemptUpdateInput): Promise<TestAttempt> {
    return prisma.testAttempt.update({
      where: { id },
      data,
    });
  }

  async createUserAnswers(answers: Prisma.UserAnswerCreateManyInput[]) {
    return prisma.userAnswer.createMany({
      data: answers
    });
  }

  async findAttemptsByUserId(userId: string) {
    return prisma.testAttempt.findMany({
      where: { userId },
      include: {
        exam: true,
        userAnswers: true
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async createAntiCheatLog(attemptId: string | null, eventType: string, details?: string, userId?: string): Promise<AntiCheatLog> {
    let finalUserId = userId;
    if (!finalUserId && attemptId) {
      const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
      if (attempt) {
        finalUserId = attempt.userId;
      }
    }

    return prisma.antiCheatLog.create({
      data: {
        attemptId,
        userId: finalUserId || '',
        eventType,
        metadata: details,
      },
    });
  }
}
