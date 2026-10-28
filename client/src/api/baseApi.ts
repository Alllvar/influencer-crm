import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { User } from './types';
import { sessionEnded, sessionStarted } from '../app/authSlice';

interface RootLike {
  auth: { accessToken: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootLike).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

type SessionResponse = { user: User; accessToken: string };

// Only one refresh request may be in flight at a time. The server rotates refresh tokens and treats
// a second use of the same token as theft, so parallel refreshes (several requests getting 401 at once,
// or React StrictMode running effects twice) must share a single request.
let refreshInFlight: Promise<SessionResponse | null> | null = null;

export function refreshSession(): Promise<SessionResponse | null> {
  refreshInFlight ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((res) => (res.ok ? (res.json() as Promise<SessionResponse>) : null))
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// On 401: get a new access token with the refresh cookie and repeat the request once.
// If refreshing fails too, the session is over and the user goes back to the login page.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const url = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 401 && !url.startsWith('/auth/')) {
    const session = await refreshSession();
    if (session) {
      api.dispatch(sessionStarted(session));
      result = await rawBaseQuery(args, api, extra);
    } else {
      api.dispatch(sessionEnded());
    }
  }
  return result;
};

// One API slice for the whole app; each feature adds its endpoints with injectEndpoints.
// Tags tell RTK Query which cached lists to refetch after a mutation.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Creator', 'Campaign', 'Stats', 'User'],
  endpoints: () => ({}),
});
