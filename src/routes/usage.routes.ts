import { Router } from 'express';
import { getMyUsage } from '../controllers/usage.controller';
import { authenticate } from '../middleware/auth.middleware';

export const usageRouter = Router();

usageRouter.get('/me', authenticate, getMyUsage);
