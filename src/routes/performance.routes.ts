import { Router } from 'express';
import { getChildPerformance } from '../controllers/performance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { childAnalyticsParamsSchema } from '../validators/analytics.validator';

export const performanceRouter = Router();

performanceRouter.use(authenticate);

performanceRouter.get(
  '/children/:childId',
  validateRequest(childAnalyticsParamsSchema),
  getChildPerformance
);
