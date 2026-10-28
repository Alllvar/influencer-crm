import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error' | 'info';
type NotifyFn = (message: string, severity?: Severity) => void;

const NotifyContext = createContext<NotifyFn>(() => {});

// Small toast system: const notify = useNotify(); notify('Saved').
export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; severity: Severity; key: number } | null>(null);

  const notify = useCallback<NotifyFn>((message, severity = 'success') => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={(_e, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity} variant="filled" onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotify = () => useContext(NotifyContext);
