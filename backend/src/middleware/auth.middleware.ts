import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import redisClient from '../config/redis';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = verifyToken(token);

    // Validate single active session in Redis
    if (decoded.id && decoded.sessionId) {
      const activeSessionId = await redisClient.get(`user:${decoded.id}:active_session`);
      if (activeSessionId && decoded.sessionId !== activeSessionId) {
        return res.status(401).json({ message: 'Session invalidated due to concurrent login' });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};
