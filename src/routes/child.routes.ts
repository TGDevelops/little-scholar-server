import { Router } from 'express';
import { createChild, deleteChild, listChildren, updateChild } from '../controllers/child.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  childIdParamsRequestSchema,
  createChildSchema,
  updateChildSchema
} from '../validators/child.validator';

export const childRouter = Router();

childRouter.use(authenticate);

childRouter.post('/', validateRequest(createChildSchema), createChild);
childRouter.get('/', listChildren);
childRouter.put('/:childId', validateRequest(updateChildSchema), updateChild);
childRouter.delete('/:childId', validateRequest(childIdParamsRequestSchema), deleteChild);
