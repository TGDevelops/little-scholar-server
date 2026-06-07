import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { childService } from '../services/child.service';
import type {
  ChildIdParams,
  CreateChildInput,
  UpdateChildInput
} from '../validators/child.validator';

const requireUserId = (userId?: string) => {
  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  return userId;
};

export const createChild = asyncHandler(async (req, res) => {
  const child = await childService.createChild(
    requireUserId(req.user?.id),
    req.body as CreateChildInput
  );
  sendSuccess(res, child, 201);
});

export const listChildren = asyncHandler(async (req, res) => {
  const children = await childService.listChildren(requireUserId(req.user?.id));
  sendSuccess(res, children);
});

export const updateChild = asyncHandler(async (req, res) => {
  const params = req.params as ChildIdParams;
  const child = await childService.updateChild(
    requireUserId(req.user?.id),
    params.childId,
    req.body as UpdateChildInput
  );
  sendSuccess(res, child);
});

export const deleteChild = asyncHandler(async (req, res) => {
  const params = req.params as ChildIdParams;
  const result = await childService.deleteChild(requireUserId(req.user?.id), params.childId);
  sendSuccess(res, result);
});
