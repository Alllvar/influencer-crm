import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Loading } from './components/common';
import { AuthGate, GuestOnly, RequireAuth } from './features/auth/AuthGate';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

// Each page is a separate chunk, loaded on first visit. The charts library, for example,
// is only downloaded when the dashboard opens, so the login page loads fast.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const DashboardPage = named(() => import('./features/dashboard/DashboardPage'), 'DashboardPage');
const CampaignsPage = named(() => import('./features/campaigns/CampaignsPage'), 'CampaignsPage');
const CampaignDetailPage = named(() => import('./features/campaigns/CampaignDetailPage'), 'CampaignDetailPage');
const CreatorsPage = named(() => import('./features/creators/CreatorsPage'), 'CreatorsPage');
const CreatorDetailPage = named(() => import('./features/creators/CreatorDetailPage'), 'CreatorDetailPage');
const TeamPage = named(() => import('./features/team/TeamPage'), 'TeamPage');

const page = (element: React.ReactNode) => <Suspense fallback={<Loading />}>{element}</Suspense>;

export function App() {
  return (
    <AuthGate>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={page(<DashboardPage />)} />
          <Route path="campaigns" element={page(<CampaignsPage />)} />
          <Route path="campaigns/:id" element={page(<CampaignDetailPage />)} />
          <Route path="creators" element={page(<CreatorsPage />)} />
          <Route path="creators/:id" element={page(<CreatorDetailPage />)} />
          <Route path="team" element={<RequireAuth role="admin">{page(<TeamPage />)}</RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  );
}
