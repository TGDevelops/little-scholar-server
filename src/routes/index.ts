import { Router } from 'express';
import { authRouter } from './auth.routes';
import { examRouter } from './exam.routes';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/exams', examRouter);
