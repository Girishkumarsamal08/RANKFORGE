import { Request, Response, NextFunction } from 'express';
import { TestService } from '../services/test.service';

const testService = new TestService();

export class TestController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { examCode } = req.body;
      if (!examCode) {
        return res.status(400).json({ message: 'examCode is required' });
      }

      const result = await testService.startTest(userId, examCode);
      return res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId, answers, antiCheatLogs } = req.body;
      if (!attemptId || !answers) {
        return res.status(400).json({ message: 'attemptId and answers array are required' });
      }

      const result = await testService.submitTest(attemptId, answers, antiCheatLogs);
      return res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const history = await testService.getHistory(userId);
      return res.status(200).json(history);
    } catch (error: any) {
      next(error);
    }
  }

  async logCheat(req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId, eventType, details } = req.body;
      if (!attemptId || !eventType) {
        return res.status(400).json({ message: 'attemptId and eventType are required' });
      }

      const log = await testService.logCheatEvent(attemptId, eventType, details);
      return res.status(201).json(log);
    } catch (error: any) {
      next(error);
    }
  }
}
