import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validateRequest(registerSchema), register);
authRouter.post('/login', authRateLimiter, validateRequest(loginSchema), login);
authRouter.get('/me', authenticate, me);
