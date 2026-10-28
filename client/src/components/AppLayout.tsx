import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useColorScheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppDispatch, useAppSelector } from '../app/store';
import { sessionEnded } from '../app/authSlice';
import { baseApi } from '../api/baseApi';
import { useLogoutMutation } from '../api/endpoints';
import { initials } from '../lib/format';
import { Logo } from './Logo';

const DRAWER_WIDTH = 248;

const NAV = [
  { to: '/', label: 'Dashboard', icon: <DashboardOutlinedIcon />, end: true },
  { to: '/campaigns', label: 'Campaigns', icon: <CampaignOutlinedIcon /> },
  { to: '/creators', label: 'Creators', icon: <PeopleAltOutlinedIcon /> },
  { to: '/team', label: 'Team', icon: <GroupsOutlinedIcon />, adminOnly: true },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  const nav = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.25 }}>
        <Logo />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Influencer CRM
        </Typography>
      </Toolbar>
      <List sx={{ px: 1.5, py: 1 }}>
        {NAV.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'text.secondary',
              '&.active': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 550 } } }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <ThemeToggle />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {nav}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: 1, borderColor: 'divider' },
          }}
        >
          {nav}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, lg: 4 } }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = mode === 'system' ? systemMode : mode;
  if (!current) return null;
  const next = current === 'dark' ? 'light' : 'dark';
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`}>
        {current === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

function UserMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  if (!user) return null;

  const signOut = async () => {
    setAnchor(null);
    await logout().catch(() => undefined);
    dispatch(sessionEnded());
    // Forget every cached response, so the next user never sees the previous user's data.
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu">
        <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main' }}>{initials(user.name)}</Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography variant="subtitle2">{user.name}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user.email} · {user.role}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={signOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
