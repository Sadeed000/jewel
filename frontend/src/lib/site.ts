/**
 * Storefront identity — the ONE place the public origin is read.
 *
 *   SITE_URL   Public origin of the storefront, e.g. https://ratnapankh.com
 *              Used for every absolute SEO URL: canonicals, Open Graph,
 *              structured data, robots.txt and the sitemap.
 *   SITE_NAME  Brand name, kept separate from the domain — see lib/brand.ts
 *              (NEXT_PUBLIC_SITE_NAME, default Ratnapankh).
 *
 * Set them in frontend/.env.production (or the host's environment), then
 * rebuild and restart: `npm run build && npm start`. Pages are pre-rendered
 * at build time, so a restart alone would keep serving the old origin.
 *
 * Server-only: these are not NEXT_PUBLIC_ variables, so never import this
 * module from a client component.
 *
 * Production safeguards — the build fails rather than ship SEO output that
 * points at the wrong place. In production SITE_URL must be:
 *   - present and a valid absolute URL
 *   - https
 *   - a bare origin (no path, query or fragment)
 *   - not localhost / a private IP / a preview host (*.vercel.app etc.)
 * The request's Host header is never used, so a spoofed or preview host
 * cannot leak into canonicals or the sitemap.
 */

import { BRAND } from './brand';

const DEV_FALLBACK = 'http://localhost:3000';

const PREVIEW_HOST = /(^|\.)(vercel\.app|netlify\.app|ngrok(-free)?\.(io|app|dev)|trycloudflare\.com|onrender\.com|herokuapp\.com|pages\.dev|github\.dev|gitpod\.io)$/i;
const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$|\.(local|localhost|internal|lan)$/i;

export function resolveSiteUrl(raw: string | undefined, production: boolean): string {
  const value = raw?.trim();
  if (!value) {
    if (production) {
      throw new Error(
        'SITE_URL is not set. Add SITE_URL=https://your-domain to frontend/.env.production (or the host environment) and rebuild.'
      );
    }
    return DEV_FALLBACK;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL "${value}" is not a valid URL. Use the form https://ratnapankh.com`);
  }

  if (production) {
    const problems: string[] = [];
    if (url.protocol !== 'https:') problems.push('must use https');
    if (LOCAL_HOST.test(url.hostname)) problems.push('must not be a local or private address');
    if (PREVIEW_HOST.test(url.hostname)) problems.push('must not be a preview/staging host');
    if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
      problems.push('must be a bare origin with no path, query or fragment');
    }
    if (url.username || url.password) problems.push('must not contain credentials');
    if (problems.length) {
      throw new Error(`SITE_URL "${value}" ${problems.join('; ')}.`);
    }
  }

  return url.origin;
}

export const SITE_URL = resolveSiteUrl(process.env.SITE_URL, process.env.NODE_ENV === 'production');

export const SITE_NAME = BRAND;

/** Default description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  'Shop rings, earrings, pendants and more from Ratnapankh. Prices in INR, secure checkout and delivery across India.';

/** Absolute URL for a site path ("/product/x" → "https://ratnapankh.com/product/x"). */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Article HTML may contain links pasted as full URLs of this site. Rewrite
 * them to relative paths so they follow the storefront to any future domain.
 * Links to other sites, and media/CDN URLs, are left untouched.
 */
export function relativiseOwnLinks(html: string): string {
  const origin = SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`href="${origin}(/[^"]*)?"`, 'g'), (_m, path) => `href="${path || '/'}"`);
}
