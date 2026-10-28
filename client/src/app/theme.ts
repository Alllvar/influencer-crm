import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#5b4cf0' },
        secondary: { main: '#0ea5a4' },
        background: { default: '#f6f7fb', paper: '#ffffff' },
        text: { primary: '#14162b', secondary: '#5d6182' },
        divider: '#e6e8f0',
      },
    },
    dark: {
      palette: {
        primary: { main: '#8f84ff' },
        secondary: { main: '#2dd4bf' },
        background: { default: '#0f1120', paper: '#171a2e' },
        divider: '#272b45',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 650 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}`, backgroundImage: 'none' }),
      },
    },
    MuiAppBar: { styleOverrides: { root: { border: 'none' } } },
    MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { border: 'none' } } },
    MuiMenu: { styleOverrides: { paper: { border: 'none' } } },
    MuiPopover: { styleOverrides: { paper: { border: 'none' } } },
    MuiAutocomplete: { styleOverrides: { paper: { border: 'none' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});
