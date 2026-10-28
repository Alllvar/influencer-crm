import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../app/authSlice';
import { baseApi } from '../api/baseApi';
import { theme } from '../app/theme';
import { NotifyProvider } from '../components/Notify';

// Renders a component with everything the app normally provides: a fresh store, theme, toasts and router.
export function renderWithApp(ui: ReactElement, { route = '/' } = {}) {
  const store = configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <NotifyProvider>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </NotifyProvider>
        </ThemeProvider>
      </Provider>,
    ),
  };
}
