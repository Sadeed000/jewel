/**
 * Brand name, safe to use in client and server components alike.
 * Separate from the domain (SITE_URL, see lib/site.ts): moving to a new
 * domain never requires renaming the brand, and vice versa.
 *
 * Override with NEXT_PUBLIC_SITE_NAME at build time if the brand changes.
 */
export const BRAND = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Ratnapankh';
