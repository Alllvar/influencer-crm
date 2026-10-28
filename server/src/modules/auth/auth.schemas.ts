import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(2).max(80),
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently truncated.
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
