import { Router } from 'express';
import { analyticsRouter } from './analytics.routes';
import { authRouter } from './auth.routes';
import { childRouter } from './child.routes';
import { examRouter } from './exam.routes';
import { examAttemptRouter } from './examAttempt.routes';
import { healthRouter } from './health.routes';
import { performanceRouter } from './performance.routes';
import { usageRouter } from './usage.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/children', childRouter);
apiRouter.use('/exams', examRouter);
apiRouter.use('/exam-attempts', examAttemptRouter);
apiRouter.use('/performance', performanceRouter);
apiRouter.use('/usage', usageRouter);
