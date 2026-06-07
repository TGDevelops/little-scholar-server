import { Router } from 'express';
import {
  createExamAttempt,
  listExamAttemptsForChild
} from '../controllers/examAttempt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  childExamAttemptsParamsSchema,
  createExamAttemptSchema
} from '../validators/examAttempt.validator';

export const examAttemptRouter = Router();

examAttemptRouter.use(authenticate);

examAttemptRouter.post('/', validateRequest(createExamAttemptSchema), createExamAttempt);
examAttemptRouter.get(
  '/children/:childId',
  validateRequest(childExamAttemptsParamsSchema),
  listExamAttemptsForChild
);
