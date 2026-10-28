import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../utils/HttpError';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { ROLES, User } from './user.model';

export const usersRouter = Router();

// Team management is admin-only.
usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users });
});

usersRouter.patch('/:id/role', validateBody(z.object({ role: z.enum(ROLES) })), async (req, res) => {
  if (req.params.id === req.user!.id) throw new HttpError(400, 'You cannot change your own role');
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
});
