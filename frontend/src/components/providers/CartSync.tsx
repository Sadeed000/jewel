'use client';

import { useCartMergeOnLogin } from '@/hooks/useUnifiedCart';

/**
 * Headless mount point for cart reconciliation.
 *
 * Lives in the storefront layout so it runs exactly once per session: when a
 * visitor who built a guest cart signs in, their local items are pushed to the
 * server cart and the local copy is cleared.
 */
export default function CartSync() {
  useCartMergeOnLogin();
  return null;
}
