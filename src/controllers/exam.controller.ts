import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { examService } from '../services/exam.service';
import type { GenerateExamInput } from '../validators/exam.validator';

export const generateExam = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const exam = await examService.generateExam(req.user.id, req.body as GenerateExamInput);
  sendSuccess(res, exam, 201);
});
