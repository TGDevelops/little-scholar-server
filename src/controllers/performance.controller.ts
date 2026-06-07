import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { performanceService } from '../services/performance.service';
import type { ChildAnalyticsParams } from '../validators/analytics.validator';

const requireUserId = (userId?: string) => {
  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  return userId;
};

export const getChildPerformance = asyncHandler(async (req, res) => {
  const params = req.params as ChildAnalyticsParams;
  const performance = await performanceService.getChildPerformance(
    requireUserId(req.user?.id),
    params.childId
  );
  sendSuccess(res, performance);
});
