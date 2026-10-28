import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import { CAMPAIGN_STATUSES, PIPELINE_STAGES, type Campaign, type CampaignStatus } from '../../api/types';
import { useCampaignsQuery } from '../../api/endpoints';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/common';
import { PlatformChip, StatusChip } from '../../components/chips';
import { formatMoney, formatRange, STAGE_COLOR, STAGE_LABEL, STATUS_LABEL, plural } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { CampaignFormDialog } from './CampaignFormDialog';

const PAGE_SIZE = 9;

export function CampaignsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const status = (params.get('status') ?? '') as CampaignStatus | '';
  const page = Number(params.get('page') ?? 1);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounced(search.trim());

  const update = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (q !== (params.get('q') ?? '')) update({ q, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the debounced search changes
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useCampaignsQuery({ q, status, page, limit: PAGE_SIZE });

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={data ? `${data.total} campaign${data.total === 1 ? '' : 's'}` : ' '}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New campaign
          </Button>
        }
      />

      <Paper sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 1, px: 2, pt: { xs: 2, md: 0 } }}
        >
          <Tabs
            value={status}
            onChange={(_e, v: string) => update({ status: v, page: null })}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="" label="All" />
            {CAMPAIGN_STATUSES.map((s) => (
              <Tab key={s} value={s} label={STATUS_LABEL[s]} />
            ))}
          </Tabs>
          <TextField
            placeholder="Search campaigns or brands"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { md: 300 }, my: { xs: 0, md: 1 }, mb: { xs: 2, md: 1 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search campaigns' },
            }}
          />
        </Stack>
        <Box sx={{ height: 2 }}>{isFetching && !isLoading && <LinearProgress sx={{ height: 2 }} />}</Box>
      </Paper>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<CampaignOutlinedIcon />}
          title={q || status ? 'No campaigns match' : 'No campaigns yet'}
          text={
            q || status
              ? 'Try another search or status.'
              : 'Create a campaign, then invite creators and track every deal.'
          }
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New campaign
            </Button>
          }
        />
      ) : (
        data && (
          <>
            <Box
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' } }}
            >
              {data.items.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </Box>
            {data.totalPages > 1 && (
              <Stack sx={{ alignItems: 'center', mt: 3 }}>
                <Pagination
                  count={data.totalPages}
                  page={data.page}
                  onChange={(_e, p) => update({ page: p })}
                  color="primary"
                />
              </Stack>
            )}
          </>
        )
      )}

      <CampaignFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => navigate(`/campaigns/${id}`)}
      />
    </>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const spentPct = c.budget ? Math.min(100, (c.spent / c.budget) * 100) : 0;
  const published = c.creators.filter((d) => d.stage === 'published').length;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/campaigns/${c.id}`}
        sx={{ height: '100%', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 650 }} noWrap>
              {c.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              {c.brand}
            </Typography>
          </Box>
          <StatusChip status={c.status} />
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.5 }}>
          {formatRange(c.startDate, c.endDate)}
        </Typography>

        <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mt: 1.5 }}>
          {c.platforms.map((p) => (
            <PlatformChip key={p} platform={p} />
          ))}
        </Stack>

        <Box sx={{ mt: 'auto', pt: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatMoney(c.spent)} of {formatMoney(c.budget)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {Math.round(spentPct)}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={spentPct} sx={{ height: 6, borderRadius: 3 }} />
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 2 }}>
            {/* One coloured segment per creator deal, ordered by pipeline stage. */}
            <Stack direction="row" sx={{ gap: 0.5, flex: 1, maxWidth: 160 }}>
              {[...c.creators]
                .sort((a, b) => PIPELINE_STAGES.indexOf(a.stage) - PIPELINE_STAGES.indexOf(b.stage))
                .map((d, i) => (
                  <Box
                    key={i}
                    title={STAGE_LABEL[d.stage]}
                    sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: STAGE_COLOR[d.stage] }}
                  />
                ))}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
              {plural(c.creators.length, 'creator')} · {published} published
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
