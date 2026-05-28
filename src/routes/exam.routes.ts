import { Router } from 'express';
import { generateExam } from '../controllers/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { generateExamSchema } from '../validators/exam.validator';

export const examRouter = Router();

examRouter.post('/generate', authenticate, validateRequest(generateExamSchema), generateExam);
