import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load configurations
dotenv.config();

// Imports
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import testRouter from './routes/test.routes';
import analyticsRouter from './routes/analytics.routes';
import { errorHandler } from './middleware/error.middleware';
import { initializeCleanupJobs } from './jobs/cleanup.job';

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/', healthRouter); // For base health check (GET /health)
app.use('/api/auth', authRouter);
app.use('/api/tests', testRouter);
app.use('/api/analytics', analyticsRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`RANKFORGE Express server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
  
  // Launch background processes
  initializeCleanupJobs();
});

export default app;
