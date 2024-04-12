import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1).max(64).transform(value => value.trim()),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  token: z.string().optional(),
  isSocial: z.boolean().optional(),
  profilePic: z.string().url().optional(),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
  resetPasswordToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

export const accountSchema = z.object({
  name: z.string().min(1).max(64).transform(value => value.trim()),
  owner: z.string().uuid(),
  balance: z.number().min(0),
});

export const userAccountSchema = z.object({
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export const transactionSchema = z.object({
  text: z.string().min(1).max(255).transform(value => value.trim()),
  amount: z.number(),
  isIncome: z.boolean(),
  transfer: z.string().optional(),
  category: z.string().optional(),
  account: z.string().uuid(),
  owner: z.string().uuid(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(64).transform(value => value.trim()),
});

export const importDataSchema = z.object({
  account: z.string().uuid(),
  user: z.string().uuid(),
  data: z.any(),
  updatedAt: z.date(),
});