import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend',
    timestamp: new Date()
  });
});

export default router;
