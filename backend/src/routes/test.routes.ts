import { Router } from 'express';
import { TestController } from '../controllers/test.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const testController = new TestController();

router.post('/start', protect, testController.start);
router.post('/submit', protect, testController.submit);
router.get('/history', protect, testController.getHistory);
router.post('/cheat-log', protect, testController.logCheat);
router.get('/attempt/:attemptId/time', protect, testController.getRemainingTime);

export default router;
