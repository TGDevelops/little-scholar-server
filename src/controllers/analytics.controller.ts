import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { analyticsService } from '../services/analytics.service';
import type {
  ChildAnalyticsParams,
  GenerateAnalyticsForChildInput
} from '../validators/analytics.validator';

export const generateAnalyticsInsight = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const insight = await analyticsService.generateInsight(
    req.user.id,
    req.body as GenerateAnalyticsForChildInput
  );

  sendSuccess(res, insight, 201);
});

export const listAnalyticsInsightsForChild = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const params = req.params as ChildAnalyticsParams;
  const insights = await analyticsService.listInsightsForChild(req.user.id, params.childId);

  sendSuccess(res, insights);
});
