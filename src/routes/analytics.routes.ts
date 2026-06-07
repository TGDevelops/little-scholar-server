import { Router } from 'express';
import {
  generateAnalyticsInsight,
  listAnalyticsInsightsForChild
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { analyticsRateLimiter } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  childAnalyticsParamsSchema,
  generateAnalyticsForChildSchema
} from '../validators/analytics.validator';

export const analyticsRouter = Router();

analyticsRouter.post(
  '/generate',
  authenticate,
  analyticsRateLimiter,
  validateRequest(generateAnalyticsForChildSchema),
  generateAnalyticsInsight
);

analyticsRouter.get(
  '/children/:childId',
  authenticate,
  validateRequest(childAnalyticsParamsSchema),
  listAnalyticsInsightsForChild
);
