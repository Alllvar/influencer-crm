import { Avatar, Box, Chip, type AvatarProps } from '@mui/material';
import type { CampaignStatus, PipelineStage, Platform } from '../api/types';
import {
  initials,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  STAGE_COLOR,
  STAGE_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../lib/format';

export function PlatformChip({ platform, size = 'small' }: { platform: Platform; size?: 'small' | 'medium' }) {
  return (
    <Chip
      size={size}
      label={PLATFORM_LABEL[platform]}
      variant="outlined"
      sx={{ '& .MuiChip-icon': { ml: 1, mr: -0.25 } }}
      icon={
        <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PLATFORM_COLOR[platform] }} />
      }
    />
  );
}

export function StatusChip({ status }: { status: CampaignStatus }) {
  return (
    <Chip
      size="small"
      label={STATUS_LABEL[status]}
      color={STATUS_COLOR[status]}
      variant={status === 'draft' ? 'outlined' : 'filled'}
    />
  );
}

export function StageDot({ stage }: { stage: PipelineStage }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STAGE_COLOR[stage] }} />
      {STAGE_LABEL[stage]}
    </Box>
  );
}

// Coloured initials; the colour comes from the platform so a list is easy to scan.
export function CreatorAvatar({
  name,
  platform,
  src,
  size = 36,
  ...rest
}: { name: string; platform: Platform; src?: string; size?: number } & AvatarProps) {
  return (
    <Avatar
      src={src}
      alt={name}
      {...rest}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 600,
        bgcolor: PLATFORM_COLOR[platform],
        ...rest.sx,
      }}
    >
      {initials(name)}
    </Avatar>
  );
}
