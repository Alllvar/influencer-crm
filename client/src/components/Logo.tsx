import { Box } from '@mui/material';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" sx={{ width: size, height: size, flexShrink: 0 }} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#5b4cf0" />
      <path d="M7.5 21.5V10.5h3v11zM13.5 21.5v-6.5h3v6.5zM19.5 21.5V13h3v8.5z" fill="#fff" />
    </Box>
  );
}
