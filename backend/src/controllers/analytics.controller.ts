import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const data = await analyticsService.getDashboardData(userId);
      return res.status(200).json(data);
    } catch (error: any) {
      next(error);
    }
  }
}
