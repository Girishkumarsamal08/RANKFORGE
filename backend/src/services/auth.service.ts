import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator';
import redisClient from '../config/redis';
import prisma from '../config/db';
import { TestService } from './test.service';

const userRepository = new UserRepository();
const testService = new TestService();

export class AuthService {
  async register(payload: any) {
    // Validate request body
    const validated = registerSchema.parse(payload);

    const existingUser = await userRepository.findByEmail(validated.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const user = await userRepository.createUser({
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      branch: validated.branch,
    });

    const sessionId = crypto.randomUUID();
    await redisClient.set(`user:${user.id}:active_session`, sessionId);

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      branch: user.branch,
      sessionId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        branch: user.branch,
      },
      token,
    };
  }

  async login(payload: any) {
    const validated = loginSchema.parse(payload);

    const user = await userRepository.findByEmail(validated.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Invalidate old session and handle security logs
    const oldSessionId = await redisClient.get(`user:${user.id}:active_session`);
    const sessionId = crypto.randomUUID();
    await redisClient.set(`user:${user.id}:active_session`, sessionId);

    if (oldSessionId) {
      // Find if there is an active test attempt in progress for this user
      const activeAttempt = await prisma.testAttempt.findFirst({
        where: {
          userId: user.id,
          status: 'IN_PROGRESS',
        },
      });

      if (activeAttempt) {
        // Log MULTIPLE_LOGIN cheat event via TestService, which handles violations & auto-submit
        try {
          await testService.logCheatEvent(activeAttempt.id, 'MULTIPLE_LOGIN', 'Session invalidated due to concurrent login.', user.id);
        } catch (err: any) {
          console.error('Failed to log multiple login cheat event:', err.message);
        }
      } else {
        // Log to database directly if there is no active attempt
        await prisma.antiCheatLog.create({
          data: {
            userId: user.id,
            eventType: 'MULTIPLE_LOGIN',
            metadata: JSON.stringify({ message: 'Session invalidated due to concurrent login.' }),
          },
        });
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      branch: user.branch,
      sessionId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        branch: user.branch,
      },
      token,
    };
  }

  async updateProfile(userId: string, payload: any) {
    const validated = updateProfileSchema.parse(payload);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await userRepository.updateUser(userId, {
      name: validated.name,
      branch: validated.branch,
    });

    let sessionId = await redisClient.get(`user:${userId}:active_session`);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      await redisClient.set(`user:${userId}:active_session`, sessionId);
    }

    // Invalidate dashboard analytics cache as branch changed
    await redisClient.del(`dashboard:${userId}`);

    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      branch: updatedUser.branch,
      sessionId,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        branch: updatedUser.branch,
      },
      token,
    };
  }
}
