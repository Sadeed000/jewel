'use client';

import { useEffect } from 'react';

/**
 * Dialogs and toasts are portalled to <body>, outside the admin wrapper, so
 * they'd otherwise keep the storefront fonts. While an admin route is
 * mounted, put the admin font variable + theme class on <body> too.
 */
export default function AdminBodyTheme({ fontClassName }: { fontClassName: string }) {
  useEffect(() => {
    const classes = [...fontClassName.split(' ').filter(Boolean), 'admin-theme'];
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, [fontClassName]);
  return null;
}
