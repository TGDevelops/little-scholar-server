import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { signAccessToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  city: true,
  createdAt: true,
  updatedAt: true
} as const;

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    });

    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        city: input.city,
        passwordHash
      },
      select: publicUserSelect
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    return { user, accessToken };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken
    };
  }
};
