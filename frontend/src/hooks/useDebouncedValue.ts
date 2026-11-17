'use client';

import { useEffect, useState } from 'react';

/**
 * Defers a rapidly-changing value so typing doesn't fire one request per
 * keystroke. Used by search and filter inputs.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
