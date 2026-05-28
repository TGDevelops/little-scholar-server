import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const healthCheck = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'little-scholar-be',
    timestamp: new Date().toISOString()
  });
});
