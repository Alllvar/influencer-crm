import { z } from 'zod';
import type { Model, QueryFilter } from 'mongoose';

// Query-string params come in as strings, so they are coerced to numbers.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Runs the page query and the total count in parallel.
export async function paginate<T>(
  model: Model<T>,
  filter: QueryFilter<T>,
  opts: { page: number; limit: number; sort: Record<string, 1 | -1> },
): Promise<Page<InstanceType<Model<T>>>> {
  const [items, total] = await Promise.all([
    model
      .find(filter)
      .sort(opts.sort)
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit),
    model.countDocuments(filter),
  ]);
  return { items, page: opts.page, limit: opts.limit, total, totalPages: Math.max(1, Math.ceil(total / opts.limit)) };
}

// Makes user input safe to use inside a RegExp (so "a+b" searches for "a+b", not a pattern).
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
