import type { Role } from '../modules/users/user.model';

// Teaches TypeScript that requests may carry the authenticated user (set by requireAuth).
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export {};
