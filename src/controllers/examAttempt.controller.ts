import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { examAttemptService } from '../services/examAttempt.service';
import type {
  ChildExamAttemptsParams,
  CreateExamAttemptInput
} from '../validators/examAttempt.validator';

const requireUserId = (userId?: string) => {
  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  return userId;
};

export const createExamAttempt = asyncHandler(async (req, res) => {
  const attempt = await examAttemptService.createAttempt(
    requireUserId(req.user?.id),
    req.body as CreateExamAttemptInput
  );
  sendSuccess(res, attempt, 201);
});

export const listExamAttemptsForChild = asyncHandler(async (req, res) => {
  const params = req.params as ChildExamAttemptsParams;
  const attempts = await examAttemptService.listAttemptsForChild(
    requireUserId(req.user?.id),
    params.childId
  );
  sendSuccess(res, attempts);
});
