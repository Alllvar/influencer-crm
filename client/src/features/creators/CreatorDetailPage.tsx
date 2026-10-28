import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlineOutlined';
import { useCreatorQuery, useDeleteCreatorMutation } from '../../api/endpoints';
import { useAppSelector } from '../../app/store';
import { ConfirmDialog, ErrorState, Loading } from '../../components/common';
import { CreatorAvatar, PlatformChip, StageDot, StatusChip } from '../../components/chips';
import { useNotify } from '../../components/Notify';
import { errorMessage } from '../../lib/errors';
import { formatCompact, formatDate, formatMoney } from '../../lib/format';
import { CreatorFormDialog } from './CreatorFormDialog';

export function CreatorDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');
  const { data, isLoading, error, refetch } = useCreatorQuery(id);
  const [deleteCreator, { isLoading: deleting }] = useDeleteCreatorMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const { creator, campaigns } = data;

  const remove = async () => {
    try {
      await deleteCreator(creator.id).unwrap();
      notify('Creator deleted');
      navigate('/creators', { replace: true });
    } catch (e) {
      setConfirmOpen(false);
      notify(errorMessage(e), 'error');
    }
  };

  const stats = [
    { label: 'Followers', value: formatCompact(creator.followers) },
    { label: 'Engagement', value: `${creator.engagementRate.toFixed(1)}%` },
    { label: 'Campaigns', value: campaigns.length },
  ];

  return (
    <>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/creators" underline="hover" color="inherit">
          Creators
        </Link>
        <Typography sx={{ color: 'text.primary' }}>{creator.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, alignItems: 'start' }}>
        <Paper sx={{ p: 3 }}>
          <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
            <CreatorAvatar name={creator.name} platform={creator.platform} src={creator.avatarUrl} size={80} />
            <Typography variant="h6" sx={{ mt: 1.5 }}>
              {creator.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              @{creator.handle}
              {creator.country ? ` · ${creator.country}` : ''}
            </Typography>
            <PlatformChip platform={creator.platform} />
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', mt: 3, textAlign: 'center' }}>
            {stats.map((s) => (
              <Box key={s.label}>
                <Typography variant="h6">{s.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {creator.niches.length > 0 && (
            <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mt: 3 }}>
              {creator.niches.map((n) => (
                <Chip key={n} label={n} size="small" />
              ))}
            </Stack>
          )}

          {creator.email && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MailOutlineIcon />}
              href={`mailto:${creator.email}`}
              sx={{ mt: 3 }}
            >
              {creator.email}
            </Button>
          )}

          {creator.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2">Notes</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                {creator.notes}
              </Typography>
            </Box>
          )}

          <Stack direction="row" sx={{ gap: 1, mt: 3 }}>
            <Button fullWidth startIcon={<EditOutlinedIcon />} variant="contained" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {isAdmin && (
              <Button fullWidth startIcon={<DeleteOutlineIcon />} color="error" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 2 }}>
            Added {formatDate(creator.createdAt)}
          </Typography>
        </Paper>

        <Paper>
          <Box sx={{ p: 2.5, pb: 1 }}>
            <Typography variant="h6">Campaigns</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Every campaign this creator was invited to
            </Typography>
          </Box>
          {campaigns.length === 0 ? (
            <Typography sx={{ p: 2.5, color: 'text.secondary' }}>Not part of any campaign yet.</Typography>
          ) : (
            <List disablePadding>
              {campaigns.map((c) => {
                const deal = c.creators[0];
                return (
                  <ListItemButton
                    key={c.id}
                    component={RouterLink}
                    to={`/campaigns/${c.id}`}
                    sx={{ px: 2.5, py: 1.5, gap: 2, flexWrap: 'wrap' }}
                  >
                    <ListItemText
                      primary={c.name}
                      secondary={`${c.brand} · ${formatDate(c.startDate)}`}
                      slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                    />
                    {deal && (
                      <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2" component="div">
                          <StageDot stage={deal.stage} />
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 64, textAlign: 'right' }}>
                          {formatMoney(deal.fee)}
                        </Typography>
                      </Stack>
                    )}
                    <StatusChip status={c.status} />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>

      <CreatorFormDialog open={editOpen} creator={creator} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this creator?"
        text={`${creator.name} will be removed for the whole team. This cannot be undone.`}
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
