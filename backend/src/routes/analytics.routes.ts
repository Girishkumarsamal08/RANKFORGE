import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/dashboard', protect, analyticsController.getDashboard);

export default router;
