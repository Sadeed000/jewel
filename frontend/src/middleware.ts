import { NextResponse, type NextRequest } from 'next/server';

/**
 * Permanent (308) redirects from a product's or article's previous slug to
 * its current one, so renaming never breaks an indexed URL or inbound link.
 *
 * Done here rather than in the page because Next 14 caches ISR pages, and a
 * cached redirect is replayed as a 308 *without a Location header* — which
 * crawlers can't follow. Middleware runs before the page cache.
 *
 * Cost: one tiny API lookup per product/article URL, memoised in memory
 * (5 min for a found redirect, 60 s for "no redirect"), so repeat views of
 * a page add no API traffic. If the API is unreachable the request simply
 * continues to the page.
 */
// `:path*` (not `:slug`): Next 14 compiles '/product/:slug' into a matcher
// that never matches a slug. The handler ignores anything but one segment.
export const config = { matcher: ['/product/:path*', '/blog/:path*'] };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';
const memo = new Map<string, { to: string | null; expires: number }>();
const MAX_ENTRIES = 5000;

async function lookup(type: 'product' | 'blog', slug: string): Promise<string | null> {
  const key = `${type}:${slug}`;
  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) return hit.to;

  let to: string | null = null;
  try {
    const url = `${API_URL}/content/redirect?type=${type}&slug=${encodeURIComponent(slug)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return null;
    to = (await res.json())?.data?.to ?? null;
  } catch {
    return null;
  }

  if (memo.size >= MAX_ENTRIES) memo.delete(memo.keys().next().value as string);
  memo.set(key, { to, expires: Date.now() + (to ? 300_000 : 60_000) });
  return to;
}

export async function middleware(req: NextRequest) {
  const [, section, slug, extra] = req.nextUrl.pathname.split('/');
  if (!slug || extra !== undefined || !/^[a-z0-9-]{1,220}$/.test(slug)) return NextResponse.next();

  const to = await lookup(section === 'blog' ? 'blog' : 'product', slug);
  if (!to || to === slug) return NextResponse.next();

  // Same host as the request, path and query preserved.
  const target = req.nextUrl.clone();
  target.pathname = `/${section}/${to}`;
  return NextResponse.redirect(target, 308);
}
