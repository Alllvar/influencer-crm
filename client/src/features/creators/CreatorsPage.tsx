import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { PLATFORMS, type Platform } from '../../api/types';
import { useCreatorsQuery } from '../../api/endpoints';
import { EmptyState, ErrorState, Loading, PageHeader } from '../../components/common';
import { CreatorAvatar, PlatformChip } from '../../components/chips';
import { formatCompact, PLATFORM_LABEL } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { CreatorFormDialog } from './CreatorFormDialog';

type SortKey = 'followers' | 'engagementRate' | 'name';

// Filters live in the URL (?q=&platform=&sort=&page=), so a filtered view can be bookmarked or shared,
// and the browser back button restores it.
export function CreatorsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const platform = (params.get('platform') ?? '') as Platform | '';
  const sort = params.get('sort') ?? '-followers';
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 10);

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

  // A new search starts from page 1.
  useEffect(() => {
    if (q !== (params.get('q') ?? '')) update({ q, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the debounced search changes
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useCreatorsQuery({ q, platform, sort, page, limit });

  const sortBy = (key: SortKey) => {
    const current = sort.replace('-', '');
    const desc = sort.startsWith('-');
    // Clicking the active column flips the direction; a new numeric column starts biggest-first.
    const next = current === key ? (desc ? key : `-${key}`) : key === 'name' ? key : `-${key}`;
    update({ sort: next, page: null });
  };

  const sortProps = (key: SortKey) => ({
    active: sort.replace('-', '') === key,
    direction: (sort.startsWith('-') ? 'desc' : 'asc') as 'asc' | 'desc',
    onClick: () => sortBy(key),
  });

  const filtered = Boolean(q || platform);

  return (
    <>
      <PageHeader
        title="Creators"
        subtitle={data ? `${data.total} creator${data.total === 1 ? '' : 's'}` : ' '}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add creator
          </Button>
        }
      />

      <Paper>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, p: 2 }}>
          <TextField
            placeholder="Search by name or handle"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: { sm: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search creators' },
            }}
          />
          <TextField
            select
            size="small"
            label="Platform"
            value={platform}
            onChange={(e) => update({ platform: e.target.value, page: null })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All platforms</MenuItem>
            {PLATFORMS.map((p) => (
              <MenuItem key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Box sx={{ height: 2 }}>{isFetching && !isLoading && <LinearProgress sx={{ height: 2 }} />}</Box>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <ErrorState error={error} onRetry={refetch} />
          </Box>
        ) : data && data.items.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState
              icon={<PeopleAltOutlinedIcon />}
              title={filtered ? 'No creators match' : 'No creators yet'}
              text={
                filtered
                  ? 'Try another search or platform.'
                  : 'Add the creators you work with to start building campaigns.'
              }
              action={
                filtered ? (
                  <Button
                    onClick={() => {
                      setSearch('');
                      update({ q: null, platform: null, page: null });
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                    Add creator
                  </Button>
                )
              }
            />
          </Box>
        ) : (
          data && (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel {...sortProps('name')}>Creator</TableSortLabel>
                      </TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell>Niches</TableCell>
                      <TableCell align="right">
                        <TableSortLabel {...sortProps('followers')}>Followers</TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel {...sortProps('engagementRate')}>Engagement</TableSortLabel>
                      </TableCell>
                      <TableCell>Country</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items.map((c) => (
                      <TableRow
                        key={c.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/creators/${c.id}`)}
                      >
                        <TableCell>
                          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                            <CreatorAvatar name={c.name} platform={c.platform} src={c.avatarUrl} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {c.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                @{c.handle}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <PlatformChip platform={c.platform} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                            {c.niches.slice(0, 3).map((n) => (
                              <Chip key={n} label={n} size="small" />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatCompact(c.followers)}
                        </TableCell>
                        <TableCell align="right">{c.engagementRate.toFixed(1)}%</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{c.country || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={data.total}
                page={data.page - 1}
                rowsPerPage={limit}
                rowsPerPageOptions={[10, 20, 50]}
                onPageChange={(_e, p) => update({ page: p + 1 })}
                onRowsPerPageChange={(e) => update({ limit: e.target.value, page: null })}
              />
            </>
          )
        )}
      </Paper>

      <CreatorFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
