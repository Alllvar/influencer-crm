import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { Alert, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { useLoginMutation } from '../../api/endpoints';
import { useAppDispatch } from '../../app/store';
import { sessionStarted } from '../../app/authSlice';
import { errorMessage } from '../../lib/errors';
import { AuthLayout } from './AuthLayout';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

const DEMO = { email: 'demo@influencer-crm.dev', password: 'demo12345' };

export function LoginPage() {
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const signIn = async (values: FormValues) => {
    try {
      dispatch(sessionStarted(await login(values).unwrap()));
      navigate(from, { replace: true });
    } catch {
      // The error is shown from the mutation state below.
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your campaigns.">
      <Stack component="form" noValidate onSubmit={handleSubmit(signIn)} sx={{ gap: 2 }}>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
        />
        <Button type="submit" variant="contained" size="large" loading={isLoading}>
          Log in
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>or</Divider>

      <Button fullWidth variant="outlined" size="large" disabled={isLoading} onClick={() => signIn(DEMO)}>
        Try the demo account
      </Button>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 3 }}>
        No account?{' '}
        <Link component={RouterLink} to="/register">
          Create one
        </Link>
      </Typography>
    </AuthLayout>
  );
}
