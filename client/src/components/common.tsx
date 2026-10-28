import type { ReactNode } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { errorMessage } from '../lib/errors';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function Loading({ minHeight = 240 }: { minHeight?: number }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        {errorMessage(error)}
      </Typography>
      {onRetry && (
        <Button onClick={onRetry} sx={{ mt: 2 }}>
          Try again
        </Button>
      )}
    </Paper>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <Paper sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
      <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 44 } }}>{icon}</Box>
      <Typography variant="h6" sx={{ mt: 1 }}>
        {title}
      </Typography>
      {text && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 420, mx: 'auto' }}>
          {text}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Paper>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <Paper sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
