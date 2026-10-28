import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { Logo } from '../../components/Logo';

const POINTS = [
  'Keep every creator, rate and contact in one place',
  'Track each deal from invite to published content',
  'See budget, spend and pipeline at a glance',
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { md: '1fr 1fr' } }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          color: '#fff',
          background: 'linear-gradient(140deg, #3b2fd1 0%, #5b4cf0 45%, #0ea5a4 100%)',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 5 }}>
          <Logo size={40} />
          <Typography variant="h6">Influencer CRM</Typography>
        </Stack>
        <Typography variant="h4" sx={{ maxWidth: 440 }}>
          Run influencer campaigns without the spreadsheet chaos.
        </Typography>
        <Stack sx={{ gap: 1.5, mt: 4 }}>
          {POINTS.map((p) => (
            <Stack key={p} direction="row" sx={{ gap: 1.25, alignItems: 'center', opacity: 0.92 }}>
              <CheckCircleOutlineIcon fontSize="small" />
              <Typography>{p}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, mb: 3, display: { md: 'none' } }}>
            <Logo />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Influencer CRM
            </Typography>
          </Stack>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
