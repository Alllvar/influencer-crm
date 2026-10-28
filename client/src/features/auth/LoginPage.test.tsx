import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from '../../test/render';
import { LoginPage } from './LoginPage';

afterEach(() => vi.unstubAllGlobals());

describe('LoginPage', () => {
  it('validates the form before calling the API', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderWithApp(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('stores the session after a successful login', async () => {
    const session = {
      user: { id: '1', email: 'anna@test.dev', name: 'Anna', role: 'admin', createdAt: '2026-01-01' },
      accessToken: 'token-123',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(session), { headers: { 'Content-Type': 'application/json' } })),
    );
    const { store } = renderWithApp(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText(/email/i), 'anna@test.dev');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await vi.waitFor(() => expect(store.getState().auth.accessToken).toBe('token-123'));
    expect(store.getState().auth.user?.name).toBe('Anna');
  });

  it('shows the server error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Invalid email or password' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    renderWithApp(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText(/email/i), 'anna@test.dev');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});
