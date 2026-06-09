import { Router } from 'express';
import { createChild, deleteChild, listChildren, updateChild } from '../controllers/child.controller';
import { generateChildExam, listChildExams } from '../controllers/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  childIdParamsRequestSchema,
  createChildSchema,
  updateChildSchema
} from '../validators/child.validator';
import { generateChildExamSchema, listChildExamsSchema } from '../validators/exam.validator';

export const childRouter = Router();

childRouter.use(authenticate);

childRouter.post('/', validateRequest(createChildSchema), createChild);
childRouter.get('/', listChildren);
childRouter.post(
  '/:childId/exams/generate',
  validateRequest(generateChildExamSchema),
  generateChildExam
);
childRouter.get('/:childId/exams', validateRequest(listChildExamsSchema), listChildExams);
childRouter.put('/:childId', validateRequest(updateChildSchema), updateChild);
childRouter.delete('/:childId', validateRequest(childIdParamsRequestSchema), deleteChild);
