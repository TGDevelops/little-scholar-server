import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { examService } from '../services/exam.service';
import type {
  ChildExamParams,
  ExamIdParams,
  GenerateChildExamInput,
  ListChildExamsQuery,
  SubmitGeneratedExamAttemptInput
} from '../validators/exam.validator';

export const generateChildExam = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const params = req.params as ChildExamParams;
  const exam = await examService.generateChildExam(
    req.user.id,
    params.childId,
    req.body as GenerateChildExamInput
  );
  sendSuccess(res, exam, 201);
});

export const listChildExams = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const params = req.params as ChildExamParams;
  const exams = await examService.listChildExams(
    req.user.id,
    params.childId,
    req.query as ListChildExamsQuery
  );
  sendSuccess(res, exams);
});

export const submitGeneratedExamAttempt = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const params = req.params as ExamIdParams;
  const result = await examService.submitGeneratedExamAttempt(
    req.user.id,
    params.examId,
    req.body as SubmitGeneratedExamAttemptInput
  );
  sendSuccess(res, result, 201);
});
