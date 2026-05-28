import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);
  sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body as LoginInput);
  sendSuccess(res, result);
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});
