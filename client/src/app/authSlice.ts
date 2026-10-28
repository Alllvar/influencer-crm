import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../api/types';

// The access token lives only in memory (not localStorage), so an XSS bug cannot read a stored token.
// After a page reload the session is restored from the httpOnly refresh cookie (see AuthGate).
interface AuthState {
  user: User | null;
  accessToken: string | null;
  // "checking" while the app tries to restore the session on first load.
  status: 'checking' | 'ready';
}

const initialState: AuthState = { user: null, accessToken: null, status: 'checking' };

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'ready';
    },
    sessionEnded(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'ready';
    },
  },
});

export const { sessionStarted, sessionEnded } = authSlice.actions;
