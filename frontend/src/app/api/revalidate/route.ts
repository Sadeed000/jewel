import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/server-api';

/**
 * Purges cached storefront pages after an admin edit, so publishing or
 * unpublishing an article is visible immediately on /blog, the article URL
 * and /sitemap.xml instead of after the 5-minute ISR window.
 *
 * POST /api/revalidate   { "scope": "blog", "slugs": ["old-slug", "new-slug"] }
 * Authorization: Bearer <admin JWT>
 *
 * The token is verified by asking the API who it belongs to; only admins may
 * purge. No shared secret to configure.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ status: 'fail', message: 'Not authorised.' }, { status: 401 });
  }

  try {
    const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: auth }, cache: 'no-store' });
    const payload = await me.json().catch(() => null);
    const role = payload?.data?.user?.role;
    if (!me.ok || role !== 'admin') {
      return NextResponse.json({ status: 'fail', message: 'Not authorised.' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ status: 'error', message: 'Could not verify session.' }, { status: 502 });
  }

  const body = await req.json().catch(() => ({}));
  const scope = body?.scope === 'products' ? 'products' : 'blog';
  const slugs: string[] = Array.isArray(body?.slugs)
    ? body.slugs.filter((s: unknown): s is string => typeof s === 'string' && /^[a-z0-9-]{1,220}$/.test(s)).slice(0, 20)
    : [];

  if (scope === 'blog') {
    revalidateTag(CACHE_TAGS.blog);
    revalidatePath('/blog');
    slugs.forEach((s) => revalidatePath(`/blog/${s}`));
  } else {
    revalidateTag(CACHE_TAGS.products);
    slugs.forEach((s) => revalidatePath(`/product/${s}`));
  }
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ status: 'success', data: { revalidated: true, scope, slugs } });
}
