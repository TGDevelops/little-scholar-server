import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.slice('Bearer '.length).replace(/^Bearer\s+/i, '').trim();
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError('Invalid or expired token', 401));
  }
};
