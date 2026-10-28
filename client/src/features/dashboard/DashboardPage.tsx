import { Link as RouterLink } from 'react-router';
import {
  Box,
  Button,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useOverviewQuery } from '../../api/endpoints';
import { useAppSelector } from '../../app/store';
import { ErrorState, Loading, PageHeader, StatCard } from '../../components/common';
import { StatusChip } from '../../components/chips';
import {
  formatCompact,
  formatMoney,
  formatRange,
  plural,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  STAGE_COLOR,
  STAGE_LABEL,
} from '../../lib/format';

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useOverviewQuery();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useTheme();

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const { campaigns, creators, pipeline, upcoming } = data;
  const openDeals = pipeline
    .filter((p) => p.stage !== 'declined' && p.stage !== 'published')
    .reduce((s, p) => s + p.count, 0);
  const spentPct = campaigns.activeBudget ? Math.min(100, (campaigns.activeSpent / campaigns.activeBudget) * 100) : 0;
  const pipelineData = pipeline.map((p) => ({ ...p, label: STAGE_LABEL[p.stage] }));
  const maxPlatform = Math.max(1, ...creators.byPlatform.map((p) => p.count));

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.name.split(' ')[0] ?? 'there'}`}
        subtitle="Here is how your campaigns are doing."
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
        <StatCard
          icon={<CampaignOutlinedIcon />}
          label="Active campaigns"
          value={campaigns.active}
          hint={`${campaigns.total} in total`}
        />
        <StatCard icon={<PeopleAltOutlinedIcon />} label="Creators" value={creators.total} hint="in your database" />
        <StatCard icon={<HandshakeOutlinedIcon />} label="Open deals" value={openDeals} hint="in active campaigns" />
        <StatCard
          icon={<PaymentsOutlinedIcon />}
          label="Committed spend"
          value={formatMoney(campaigns.activeSpent)}
          hint={`of ${formatMoney(campaigns.activeBudget)} active budget`}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, mt: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6">Deal pipeline</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Creators in active campaigns, by stage
          </Typography>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ left: -20, right: 8 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: theme.palette.action.hover }}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.paper,
                  }}
                  formatter={(value, _name, item) => [`${value} deals · ${formatMoney(item.payload.fees)}`, '']}
                  separator=""
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {pipelineData.map((p) => (
                    <Cell key={p.stage} fill={STAGE_COLOR[p.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active budget used
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {Math.round(spentPct)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={spentPct} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6">Creators by platform</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Count and total reach
          </Typography>
          <Stack sx={{ gap: 2 }}>
            {creators.byPlatform.map((p) => (
              <Box key={p.platform}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 550 }}>
                    {PLATFORM_LABEL[p.platform]}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {p.count} · {formatCompact(p.followers)} reach
                  </Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${(p.count / maxPlatform) * 100}%`,
                      bgcolor: PLATFORM_COLOR[p.platform],
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Paper sx={{ mt: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', p: 2.5, pb: 1 }}>
          <Box>
            <Typography variant="h6">Upcoming and running</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Draft and active campaigns that have not ended
            </Typography>
          </Box>
          <Button component={RouterLink} to="/campaigns">
            All campaigns
          </Button>
        </Stack>
        {upcoming.length === 0 ? (
          <Typography sx={{ p: 2.5, color: 'text.secondary' }}>Nothing scheduled yet.</Typography>
        ) : (
          <List disablePadding>
            {upcoming.map((c) => (
              <ListItemButton
                key={c.id}
                component={RouterLink}
                to={`/campaigns/${c.id}`}
                sx={{ px: 2.5, py: 1.5, gap: 2 }}
              >
                <ListItemText
                  primary={c.name}
                  secondary={`${c.brand} · ${formatRange(c.startDate, c.endDate)} · ${plural(c.creators.length, 'creator')}`}
                  slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  {formatMoney(c.budget)}
                </Typography>
                <StatusChip status={c.status} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}
