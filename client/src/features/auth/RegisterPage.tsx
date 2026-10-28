import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useRegisterMutation } from '../../api/endpoints';
import { useAppDispatch } from '../../app/store';
import { sessionStarted } from '../../app/authSlice';
import { applyFieldErrors, errorMessage } from '../../lib/errors';
import { AuthLayout } from './AuthLayout';

// Same rules as the API, so most mistakes are caught before the request is sent.
const schema = z
  .object({
    name: z.string().trim().min(2, 'At least 2 characters').max(80),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  const submit = async ({ confirm: _confirm, ...values }: FormValues) => {
    try {
      dispatch(sessionStarted(await registerUser(values).unwrap()));
      navigate('/', { replace: true });
    } catch (e) {
      applyFieldErrors(e, setError);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="The first account on a fresh install becomes the admin.">
      <Stack component="form" noValidate onSubmit={handleSubmit(submit)} sx={{ gap: 2 }}>
        {error && <Alert severity="error">{errorMessage(error)}</Alert>}
        <TextField
          label="Full name"
          autoComplete="name"
          autoFocus
          {...register('name')}
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={Boolean(errors.password)}
          helperText={errors.password?.message ?? '8–72 characters'}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...register('confirm')}
          error={Boolean(errors.confirm)}
          helperText={errors.confirm?.message}
        />
        <Button type="submit" variant="contained" size="large" loading={isLoading}>
          Create account
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 3 }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Log in
        </Link>
      </Typography>
    </AuthLayout>
  );
}
