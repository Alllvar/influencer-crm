import { useEffect, useState } from 'react';

// Returns the value only after it stopped changing for `delay` ms.
// Used for search inputs, so typing "anna" sends one request instead of four.
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
