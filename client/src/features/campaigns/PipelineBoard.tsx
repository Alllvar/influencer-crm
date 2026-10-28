import { useState, type DragEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Divider, IconButton, Link, ListItemIcon, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { PIPELINE_STAGES, type CreatorSummary, type Deal, type PipelineStage } from '../../api/types';
import { formatCompact, formatMoney, STAGE_COLOR, STAGE_LABEL } from '../../lib/format';
import { CreatorAvatar } from '../../components/chips';

type CreatorDeal = Deal<CreatorSummary>;

// Kanban board of creator deals. Cards can be dragged between columns (desktop)
// or moved with the card menu (works on touch screens and with a keyboard too).
export function PipelineBoard({
  deals,
  onMove,
  onEdit,
  onRemove,
}: {
  deals: CreatorDeal[];
  onMove: (deal: CreatorDeal, stage: PipelineStage) => void;
  onEdit: (deal: CreatorDeal) => void;
  onRemove: (deal: CreatorDeal) => void;
}) {
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null);

  const drop = (e: DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOver(null);
    const deal = deals.find((d) => d.creator.id === e.dataTransfer.getData('text/plain'));
    if (deal && deal.stage !== stage) onMove(deal, stage);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        // Phones and tablets scroll sideways; on wide screens all six columns fit.
        gridAutoColumns: { xs: '78%', sm: '46%', md: 'minmax(220px, 1fr)', xl: 'minmax(0, 1fr)' },
        gap: 1.5,
        overflowX: 'auto',
        pb: 1,
        scrollSnapType: 'x mandatory',
      }}
    >
      {PIPELINE_STAGES.map((stage) => {
        const column = deals.filter((d) => d.stage === stage);
        const total = column.reduce((s, d) => s + d.fee, 0);
        return (
          <Box
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage);
            }}
            onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
            onDrop={(e) => drop(e, stage)}
            sx={{
              scrollSnapAlign: 'start',
              borderRadius: 2,
              p: 1,
              minHeight: 200,
              bgcolor: dragOver === stage ? 'action.selected' : 'action.hover',
              outline: dragOver === stage ? 2 : 0,
              outlineColor: 'primary.main',
              outlineStyle: 'dashed',
              transition: 'background-color .15s',
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 0.5, py: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STAGE_COLOR[stage] }} />
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {STAGE_LABEL[stage]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {column.length}
                {total > 0 && ` · ${formatMoney(total)}`}
              </Typography>
            </Stack>
            <Stack sx={{ gap: 1, mt: 0.5 }}>
              {column.map((deal) => (
                <DealCard key={deal.creator.id} deal={deal} onMove={onMove} onEdit={onEdit} onRemove={onRemove} />
              ))}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

function DealCard({
  deal,
  onMove,
  onEdit,
  onRemove,
}: {
  deal: CreatorDeal;
  onMove: (deal: CreatorDeal, stage: PipelineStage) => void;
  onEdit: (deal: CreatorDeal) => void;
  onRemove: (deal: CreatorDeal) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { creator } = deal;
  const close = () => setAnchor(null);

  return (
    <Paper
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', creator.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      sx={{ p: 1.5, cursor: 'grab', '&:active': { cursor: 'grabbing' }, '&:hover': { borderColor: 'primary.main' } }}
    >
      <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
        <CreatorAvatar name={creator.name} platform={creator.platform} src={creator.avatarUrl} size={32} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Link
            component={RouterLink}
            to={`/creators/${creator.id}`}
            underline="hover"
            color="inherit"
            variant="body2"
            sx={{ fontWeight: 600, display: 'block' }}
            noWrap
          >
            {creator.name}
          </Link>
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap component="div">
            @{creator.handle} · {formatCompact(creator.followers)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Actions for ${creator.name}`}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {(deal.deliverables || deal.fee > 0) && (
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, mt: 1.25 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {deal.deliverables}
          </Typography>
          {deal.fee > 0 && (
            <Typography variant="caption" sx={{ fontWeight: 600, flexShrink: 0 }}>
              {formatMoney(deal.fee)}
            </Typography>
          )}
        </Stack>
      )}
      {deal.contentUrl && (
        <Link
          href={deal.contentUrl}
          target="_blank"
          rel="noreferrer"
          variant="caption"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1 }}
        >
          View content <OpenInNewIcon sx={{ fontSize: 12 }} />
        </Link>
      )}

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>
          Move to
        </Typography>
        {PIPELINE_STAGES.filter((s) => s !== deal.stage).map((stage) => (
          <MenuItem
            key={stage}
            dense
            onClick={() => {
              close();
              onMove(deal, stage);
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STAGE_COLOR[stage], mr: 1.5 }} />
            {STAGE_LABEL[stage]}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          dense
          onClick={() => {
            close();
            onEdit(deal);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit fee and content
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            close();
            onRemove(deal);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          Remove from campaign
        </MenuItem>
      </Menu>
    </Paper>
  );
}
