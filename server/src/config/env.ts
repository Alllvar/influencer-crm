import 'dotenv/config';
import { z } from 'zod';

// `JWT_ACCESS_SECRET=` (empty line in .env) counts as "not set".
const optionalSecret = z.preprocess((v) => (v === '' ? undefined : v), z.string().min(32).optional());

// Validate environment variables once at startup, so a typo in .env fails fast
// with a clear message instead of breaking somewhere deep in the app.
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().optional(),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

    // Two different secrets: a leaked access secret must not let anyone mint refresh tokens.
    JWT_ACCESS_SECRET: optionalSecret,
    JWT_REFRESH_SECRET: optionalSecret,
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  })
  .transform((e, ctx) => {
    if (e.NODE_ENV === 'production' && (!e.JWT_ACCESS_SECRET || !e.JWT_REFRESH_SECRET)) {
      ctx.addIssue({ code: 'custom', message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production' });
      return z.NEVER;
    }
    // Fixed fallbacks only for local development and tests.
    return {
      ...e,
      JWT_ACCESS_SECRET: e.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-0123456789',
      JWT_REFRESH_SECRET: e.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me-0123456789',
    };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
