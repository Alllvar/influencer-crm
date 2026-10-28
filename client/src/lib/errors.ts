import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../api/types';

const isApiError = (e: unknown): e is ApiError => typeof e === 'object' && e !== null && 'status' in e;

// Turns whatever RTK Query threw into one human-readable sentence.
export function errorMessage(e: unknown): string {
  if (isApiError(e)) {
    if (e.status === 'FETCH_ERROR') return 'Cannot reach the server. Check your connection.';
    return e.data?.error?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}

// Puts the server's per-field validation errors under the matching form inputs.
// Returns true if at least one field error was shown.
export function applyFieldErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>): boolean {
  const details = isApiError(e) ? e.data?.error?.details : undefined;
  if (!details) return false;
  const entries = Object.entries(details).filter(([, msgs]) => msgs?.length);
  entries.forEach(([field, msgs]) => setError(field as Path<T>, { message: msgs[0] }));
  return entries.length > 0;
}
