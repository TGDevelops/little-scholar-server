import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { planQuotaService } from '../services/planQuotaService';

export const getMyUsage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const usage = await planQuotaService.getUsageStatus(req.user.id);

  sendSuccess(res, {
    plan: usage.plan,
    questionsUsedThisWeek: usage.questionsUsedThisWeek,
    weeklyQuestionLimit: usage.weeklyQuestionLimit,
    questionsRemainingThisWeek: usage.questionsRemainingThisWeek,
    ...(usage.weeklyInsightLimit !== null
      ? {
          insightsUsedThisWeek: usage.insightsUsedThisWeek,
          weeklyInsightLimit: usage.weeklyInsightLimit,
          insightsRemainingThisWeek: usage.insightsRemainingThisWeek
        }
      : {
          dailyInsightLimitPerChild: usage.dailyInsightLimitPerChild
        }),
    childrenUsed: usage.childrenUsed,
    childrenLimit: usage.childrenLimit,
    weekStart: usage.weekStart.toISOString(),
    weekEnd: usage.weekEnd.toISOString()
  });
});
