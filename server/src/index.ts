import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import logger from './lib/logger';
import { connectDB } from '../../database/connection';
import authRouter from './routes/auth';
import companyRouter from './routes/company';
import jobsRouter from './routes/jobs';
import resumeRouter from './routes/resume';
import applicationRouter from './routes/application';
import interviewRouter from './routes/interview';
import { startScheduler } from './scheduler';
import { errorHandler } from './utils/errors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use winston stream for morgan HTTP logging
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan('dev', { stream: morganStream }));

// ── Rate Limiting (General) ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
  },
});
app.use('/api/', limiter);

// ── API Routes ──
app.use('/api/auth', authRouter);
app.use('/api/company', companyRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/application', applicationRouter);
app.use('/api/interview', interviewRouter);

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Placeholder for root API endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'AI Interview Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      jobs: '/api/jobs/*',
      applications: '/api/applications/*',
      interviews: '/api/interviews/*',
    },
  });
});

// ── Error Handling Middleware (must be last) ──
app.use(errorHandler);

// ── Start Server ──
async function startServer() {
  try {
    // Connect to the database before starting the Express server
    await connectDB();

    // Start background interview reminder scheduler
    startScheduler();

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server due to connection error:', error);
    process.exit(1);
  }
}

startServer();

export default app;
