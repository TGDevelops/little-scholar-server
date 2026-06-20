import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;
  let code: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    if (
      error.details &&
      typeof error.details === 'object' &&
      'code' in error.details
    ) {
      const { code: errorCode, ...rest } = error.details as Record<string, unknown>;
      code = errorCode;
      details = Object.keys(rest).length > 0 ? rest : undefined;
    } else {
      details = error.details;
    }
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Resource already exists';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      ...(typeof code === 'string' ? { code } : {}),
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV !== 'production' && error instanceof Error ? { stack: error.stack } : {})
    }
  });
};
