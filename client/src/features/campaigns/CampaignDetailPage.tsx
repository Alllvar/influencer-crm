import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { Box, Breadcrumbs, Button, LinearProgress, Link, Paper, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import type { CreatorSummary, Deal, PipelineStage } from '../../api/types';
import {
  useCampaignQuery,
  useDeleteCampaignMutation,
  useRemoveDealMutation,
  useUpdateDealMutation,
} from '../../api/endpoints';
import { useAppSelector } from '../../app/store';
import { ConfirmDialog, EmptyState, ErrorState, Loading } from '../../components/common';
import { PlatformChip, StatusChip } from '../../components/chips';
import { useNotify } from '../../components/Notify';
import { errorMessage } from '../../lib/errors';
import { formatMoney, formatRange, STAGE_LABEL } from '../../lib/format';
import { CampaignFormDialog } from './CampaignFormDialog';
import { AddCreatorDialog, EditDealDialog } from './DealDialogs';
import { PipelineBoard } from './PipelineBoard';

type CreatorDeal = Deal<CreatorSummary>;

export function CampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');

  const { data, isLoading, error, refetch } = useCampaignQuery(id);
  const [updateDeal] = useUpdateDealMutation();
  const [removeDeal, { isLoading: removing }] = useRemoveDealMutation();
  const [deleteCampaign, { isLoading: deleting }] = useDeleteCampaignMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<CreatorDeal | null>(null);
  const [removingDeal, setRemovingDeal] = useState<CreatorDeal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const { campaign } = data;
  // A deal whose creator was deleted elsewhere comes back with creator: null; skip it.
  const deals = campaign.creators.filter((d): d is CreatorDeal => d.creator !== null);
  const remaining = campaign.budget - campaign.spent;
  const spentPct = campaign.budget ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0;

  const move = async (deal: CreatorDeal, stage: PipelineStage) => {
    try {
      await updateDeal({ campaignId: campaign.id, creatorId: deal.creator.id, stage }).unwrap();
      notify(`${deal.creator.name} → ${STAGE_LABEL[stage]}`);
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  };

  const confirmRemove = async () => {
    if (!removingDeal) return;
    try {
      await removeDeal({ campaignId: campaign.id, creatorId: removingDeal.creator.id }).unwrap();
      notify(`${removingDeal.creator.name} removed from the campaign`);
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
    setRemovingDeal(null);
  };

  const remove = async () => {
    try {
      await deleteCampaign(campaign.id).unwrap();
      notify('Campaign deleted');
      navigate('/campaigns', { replace: true });
    } catch (e) {
      setConfirmDelete(false);
      notify(errorMessage(e), 'error');
    }
  };

  const figures = [
    { label: 'Budget', value: formatMoney(campaign.budget) },
    { label: 'Committed', value: formatMoney(campaign.spent) },
    { label: 'Remaining', value: formatMoney(remaining), warn: remaining < 0 },
    { label: 'Creators', value: deals.length },
  ];

  return (
    <>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/campaigns" underline="hover" color="inherit">
          Campaigns
        </Link>
        <Typography sx={{ color: 'text.primary' }}>{campaign.name}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" component="h1">
                {campaign.name}
              </Typography>
              <StatusChip status={campaign.status} />
            </Stack>
            <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
              {campaign.brand} · {formatRange(campaign.startDate, campaign.endDate)}
            </Typography>
            <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mt: 1.5 }}>
              {campaign.platforms.map((p) => (
                <PlatformChip key={p} platform={p} />
              ))}
            </Stack>
          </Box>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start', flexShrink: 0 }}>
            <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {isAdmin && (
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </Stack>
        </Stack>

        {campaign.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, maxWidth: 760, whiteSpace: 'pre-wrap' }}>
            {campaign.description}
          </Typography>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mt: 3 }}>
          {figures.map((f) => (
            <Box key={f.label}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {f.label}
              </Typography>
              <Typography variant="h6" sx={{ color: f.warn ? 'error.main' : 'text.primary' }}>
                {f.value}
              </Typography>
            </Box>
          ))}
        </Box>
        <LinearProgress
          variant="determinate"
          value={spentPct}
          color={remaining < 0 ? 'error' : 'primary'}
          sx={{ height: 8, borderRadius: 4, mt: 2 }}
        />
      </Paper>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2, gap: 2 }}>
        <Box>
          <Typography variant="h6">Creator pipeline</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Drag cards between columns, or use the card menu.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddAlt1OutlinedIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          Invite creator
        </Button>
      </Stack>

      {deals.length === 0 ? (
        <EmptyState
          icon={<GroupAddOutlinedIcon />}
          title="No creators yet"
          text="Invite creators from your database, then move each deal through the pipeline until the content is live."
          action={
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Invite the first creator
            </Button>
          }
        />
      ) : (
        <PipelineBoard deals={deals} onMove={move} onEdit={setEditingDeal} onRemove={setRemovingDeal} />
      )}

      <CampaignFormDialog open={editOpen} campaign={campaign} onClose={() => setEditOpen(false)} />
      <AddCreatorDialog
        open={addOpen}
        campaignId={campaign.id}
        existingIds={deals.map((d) => d.creator.id)}
        onClose={() => setAddOpen(false)}
      />
      <EditDealDialog campaignId={campaign.id} deal={editingDeal} onClose={() => setEditingDeal(null)} />
      <ConfirmDialog
        open={Boolean(removingDeal)}
        title="Remove from campaign?"
        text={`${removingDeal?.creator.name ?? 'This creator'} and their deal details will be removed from ${campaign.name}.`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={confirmRemove}
        onClose={() => setRemovingDeal(null)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this campaign?"
        text={`${campaign.name} and all its creator deals will be deleted. This cannot be undone.`}
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
