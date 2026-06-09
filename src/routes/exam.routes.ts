import { Router } from 'express';
import { submitGeneratedExamAttempt } from '../controllers/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { submitGeneratedExamAttemptSchema } from '../validators/exam.validator';

export const examRouter = Router();

examRouter.post(
  '/:examId/attempt',
  authenticate,
  validateRequest(submitGeneratedExamAttemptSchema),
  submitGeneratedExamAttempt
);
