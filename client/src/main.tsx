import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource-variable/inter';
import { store } from './app/store';
import { theme } from './app/theme';
import { NotifyProvider } from './components/Notify';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <NotifyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </NotifyProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
