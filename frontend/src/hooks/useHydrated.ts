'use client';

import { useEffect, useState } from 'react';

/**
 * Returns false during SSR and the first client render, true afterwards.
 * Gate anything that reads persisted (localStorage-backed) store state on
 * this, so the first client render matches the server HTML.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
