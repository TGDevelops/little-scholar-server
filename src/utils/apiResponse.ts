import type { Response } from 'express';
import type { ApiResponse } from '../types/api';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200
): Response<ApiResponse<T>> =>
  res.status(statusCode).json({
    success: true,
    data
  });
