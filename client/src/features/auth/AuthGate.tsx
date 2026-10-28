import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { sessionEnded, sessionStarted } from '../../app/authSlice';
import { refreshSession } from '../../api/baseApi';
import { Loading } from '../../components/common';

// On first load, tries to restore the session from the httpOnly refresh cookie.
// Until that finishes, nothing is rendered, so pages never flash the login screen for a logged-in user.
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status !== 'checking') return;
    void refreshSession().then((session) => dispatch(session ? sessionStarted(session) : sessionEnded()));
  }, [dispatch, status]);

  if (status === 'checking') return <Loading minHeight={400} />;
  return <>{children}</>;
}

// Wraps pages that need a logged-in user; remembers where the user wanted to go.
export function RequireAuth({ children, role }: { children: ReactNode; role?: 'admin' }) {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// The opposite: login/register pages bounce a logged-in user to the app.
export function GuestOnly({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}
