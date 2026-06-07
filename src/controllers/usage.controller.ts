import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { usageService } from '../services/usage.service';

export const getMyUsage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const usage = await usageService.getRemainingTokens(req.user.id);

  sendSuccess(res, {
    plan: usage.plan,
    monthlyLimit: usage.monthlyLimit,
    tokensUsed: usage.tokensUsed,
    remainingTokens: usage.remainingTokens,
    periodStart: usage.periodStart.toISOString(),
    periodEnd: usage.periodEnd.toISOString()
  });
});
