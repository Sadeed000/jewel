/**
 * End-to-end API test suite — exercises every route against a real MongoDB.
 *
 *   npm run test:api
 *
 * Safety: it ONLY runs against a local database whose name contains "test"
 * (default mongodb://127.0.0.1:27017/aurelia_e2e_test) and drops that
 * database when it finishes. It never reads backend/.env, so it can't touch
 * the live database by accident. Override with TEST_MONGO_URI.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/aurelia_e2e_test';
{
  const u = new URL(MONGO_URI);
  const dbName = u.pathname.slice(1);
  if (!['127.0.0.1', 'localhost'].includes(u.hostname) || !/test/i.test(dbName)) {
    throw new Error(`Refusing to run E2E tests against ${u.hostname}/${dbName}: use a local *test* database.`);
  }
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'e2e-webhook-secret';
delete process.env.RAZORPAY_KEY_ID;
delete process.env.RAZORPAY_KEY_SECRET;
process.env.RATE_LIMIT_MAX = '100000';

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');

let server;
let BASE;
const tokens = {};
const ids = {};

/** Small fetch wrapper returning { status, body }. */
async function call(method, path, { token, body, headers = {}, raw } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

const expectStatus = (res, status, label = '') =>
  assert.equal(res.status, status, `${label} expected ${status}, got ${res.status}: ${JSON.stringify(res.body)?.slice(0, 400)}`);

const productPayload = (overrides = {}) => ({
  name: `E2E Ring ${crypto.randomBytes(3).toString('hex')}`,
  category: 'gold',
  type: 'rings',
  price: 3000,
  originalPrice: 3500,
  images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
  metal: 'Yellow Gold',
  purity: '22K',
  weight: '3.2 g',
  description: 'A test ring for the end-to-end suite.',
  stockQty: 10,
  inStock: true,
  engravingAvailable: true,
  ...overrides,
});

const address = {
  firstName: 'Test',
  lastName: 'Buyer',
  phone: '+91 98765 43210',
  line1: '12 MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

test.before(async () => {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.db.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));

  await User.create({
    firstName: 'Admin', email: 'admin@example.com', password: 'AdminPass123', role: 'admin',
  });

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}/api/v1`;
});

test.after(async () => {
  server?.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

/* ───────────────────────── Public endpoints ───────────────────────── */

test('health, root and 404', async () => {
  expectStatus(await call('GET', '/health'), 200);
  const nf = await call('GET', '/does-not-exist');
  expectStatus(nf, 404);
  assert.equal(nf.body.status, 'fail');
});

test('gold rate + digital gold calculator', async () => {
  const rate = await call('GET', '/gold-rate');
  expectStatus(rate, 200);
  assert.ok(rate.body.data.rates.length > 0);

  const calc = await call('GET', '/digital-gold/calculate?monthlyAmount=1000&tenureMonths=10');
  expectStatus(calc, 200);
  assert.equal(calc.body.data.totalCommitted, 10000);

  expectStatus(await call('GET', '/digital-gold/calculate?monthlyAmount=abc'), 400, 'bad calculator input');
});

test('public content endpoints', async () => {
  for (const p of ['/content/settings', '/content/banners', '/content/testimonials', '/content/blog', '/content/categories', '/content/categories?nav=true']) {
    expectStatus(await call('GET', p), 200, p);
  }
  expectStatus(await call('GET', '/content/categories/nope'), 404);
  expectStatus(await call('GET', '/content/blog/nope'), 404);
});

test('stores: list, search with regex metacharacters, geo search, 404', async () => {
  expectStatus(await call('GET', '/stores'), 200);
  expectStatus(await call('GET', `/stores?q=${encodeURIComponent('(mumbai')}`), 200, 'unescaped regex');
  expectStatus(await call('GET', `/stores?city=${encodeURIComponent('[')}`), 200, 'unescaped city regex');
  expectStatus(await call('GET', '/stores?lng=72.87&lat=19.07&radius=50000'), 200, 'geo search');
  expectStatus(await call('GET', '/stores/nope'), 404);
});

test('payment config, custom ring options and quote', async () => {
  const cfg = await call('GET', '/orders/payment/config');
  expectStatus(cfg, 200);
  assert.equal(cfg.body.data.razorpayEnabled, false);

  const opts = await call('GET', '/products/custom/options');
  expectStatus(opts, 200);
  const o = opts.body.data;
  ids.ringConfig = {
    stone: o.stones[0].value,
    metal: o.metals[0].value,
    setting: o.settings[0].value,
    carat: o.stones[0].minCarat,
    size: o.sizes[0],
  };
  const quote = await call('POST', '/products/custom/quote', { body: ids.ringConfig });
  expectStatus(quote, 200, `quote ${JSON.stringify(ids.ringConfig)}`);
  assert.ok(quote.body.data.quote.total > 0);

  expectStatus(await call('POST', '/products/custom/quote', { body: { stone: 'kryptonite' } }), 400);
});

test('image search: status + missing file', async () => {
  expectStatus(await call('GET', '/products/image-search/status'), 200);
  expectStatus(await call('POST', '/products/image-search'), 400);
});

test('newsletter subscribe / unsubscribe / validation', async () => {
  expectStatus(await call('POST', '/newsletter/subscribe', { body: { email: 'news@example.com' } }), 201);
  expectStatus(await call('POST', '/newsletter/subscribe', { body: { email: 'news@example.com' } }), 201, 'idempotent');
  expectStatus(await call('POST', '/newsletter/unsubscribe', { body: { email: 'news@example.com' } }), 200);
  expectStatus(await call('POST', '/newsletter/unsubscribe', { body: { email: 'ghost@example.com' } }), 404);
  expectStatus(await call('POST', '/newsletter/subscribe', { body: { email: 'not-an-email' } }), 400);
});

test('contact form', async () => {
  expectStatus(await call('POST', '/contact', { body: { name: 'A', email: 'a@example.com', message: 'Hello there' } }), 201);
  expectStatus(await call('POST', '/contact', { body: { name: 'A' } }), 400);
});

/* ───────────────────────── Auth ───────────────────────── */

test('auth: register, login, me, password change, logout', async () => {
  expectStatus(await call('POST', '/auth/register', { body: { email: 'x@example.com' } }), 400, 'missing fields');

  const reg = await call('POST', '/auth/register', {
    body: { firstName: 'Cust', lastName: 'Omer', email: 'cust@example.com', password: 'CustPass123' },
  });
  expectStatus(reg, 201);
  assert.ok(reg.body.data.token);
  assert.equal(reg.body.data.user.password, undefined, 'password must never be returned');

  expectStatus(await call('POST', '/auth/register', {
    body: { firstName: 'Dup', email: 'cust@example.com', password: 'CustPass123' },
  }), 409, 'duplicate email');

  expectStatus(await call('POST', '/auth/login', { body: { email: 'cust@example.com', password: 'wrong' } }), 401);
  expectStatus(await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'wrong' } }), 401);

  const login = await call('POST', '/auth/login', { body: { email: 'cust@example.com', password: 'CustPass123' } });
  expectStatus(login, 200);
  tokens.customer = login.body.data.token;
  ids.customer = login.body.data.user._id;

  const admin = await call('POST', '/auth/login', { body: { email: 'admin@example.com', password: 'AdminPass123' } });
  expectStatus(admin, 200);
  tokens.admin = admin.body.data.token;

  const me = await call('GET', '/auth/me', { token: tokens.customer });
  expectStatus(me, 200);
  assert.equal(me.body.data.user.email, 'cust@example.com');

  expectStatus(await call('GET', '/auth/me'), 401, 'no token');
  expectStatus(await call('GET', '/auth/me', { token: 'garbage' }), 401, 'bad token');

  expectStatus(await call('PATCH', '/auth/update-password', {
    token: tokens.customer, body: { currentPassword: 'nope', newPassword: 'NewPass12345' },
  }), 401, 'wrong current password');

  // Tokens issued in the same second as passwordChangedAt would be rejected; wait a beat.
  await new Promise((r) => setTimeout(r, 1100));
  const upd = await call('PATCH', '/auth/update-password', {
    token: tokens.customer, body: { currentPassword: 'CustPass123', newPassword: 'NewPass12345' },
  });
  expectStatus(upd, 200);
  tokens.customer = upd.body.data.token;
  expectStatus(await call('GET', '/auth/me', { token: tokens.customer }), 200, 'new token works');

  expectStatus(await call('POST', '/auth/logout'), 200);
});

test('protected routes reject anonymous users and non-admins', async () => {
  for (const [m, p] of [['GET', '/cart'], ['GET', '/wishlist'], ['GET', '/orders/my'], ['GET', '/users/me'], ['GET', '/digital-gold/my-plans'], ['GET', '/admin/dashboard']]) {
    expectStatus(await call(m, p), 401, `${m} ${p}`);
  }
  for (const [m, p] of [['GET', '/admin/dashboard'], ['GET', '/admin/orders'], ['POST', '/products'], ['POST', '/content/categories'], ['POST', '/uploads']]) {
    expectStatus(await call(m, p, { token: tokens.customer, body: m === 'GET' ? undefined : {} }), 403, `customer ${m} ${p}`);
  }
});

/* ───────────────────────── Admin CRUD ───────────────────────── */

test('admin: categories CRUD', async () => {
  const c = await call('POST', '/content/categories', {
    token: tokens.admin,
    body: { name: 'E2E Rings', image: '/img/rings.jpg', showInNav: true, subCategories: [{ name: 'Bands' }] },
  });
  expectStatus(c, 201);
  ids.category = c.body.data.category._id;
  const slug = c.body.data.category.slug;

  expectStatus(await call('GET', `/content/categories/${slug}`), 200);
  const nav = await call('GET', '/content/categories?nav=true');
  assert.ok(nav.body.data.categories.some((x) => x._id === ids.category));

  expectStatus(await call('PATCH', `/content/categories/${ids.category}`, {
    token: tokens.admin, body: { name: 'E2E Rings 2', image: '/img/rings.jpg' },
  }), 200);
  expectStatus(await call('POST', '/content/categories', { token: tokens.admin, body: { name: 'x' } }), 400, 'missing image');

  expectStatus(await call('DELETE', `/content/categories/${ids.category}`, { token: tokens.admin }), 204);
  expectStatus(await call('DELETE', `/content/categories/${ids.category}`, { token: tokens.admin }), 404);
  expectStatus(await call('DELETE', '/content/categories/not-an-id', { token: tokens.admin }), 400, 'cast error');
});

test('admin: banners, testimonials, blog, settings CRUD', async () => {
  const b = await call('POST', '/content/banners', {
    token: tokens.admin, body: { title: 'Hero', image: '/img/hero.jpg', placement: 'home-hero' },
  });
  expectStatus(b, 201);
  expectStatus(await call('PATCH', `/content/banners/${b.body.data.banner._id}`, {
    token: tokens.admin, body: { title: 'Hero 2', image: '/img/hero.jpg', placement: 'home-hero' },
  }), 200);
  const banners = await call('GET', '/content/banners?placement=home-hero');
  assert.equal(banners.body.data.banners.length, 1);
  expectStatus(await call('DELETE', `/content/banners/${b.body.data.banner._id}`, { token: tokens.admin }), 204);

  const t = await call('POST', '/content/testimonials', {
    token: tokens.admin, body: { author: 'Priya', quote: 'Absolutely stunning work.', rating: 5, isFeatured: true },
  });
  expectStatus(t, 201);
  const feat = await call('GET', '/content/testimonials?featured=true');
  assert.equal(feat.body.data.testimonials.length, 1);
  expectStatus(await call('PATCH', `/content/testimonials/${t.body.data.testimonial._id}`, {
    token: tokens.admin, body: { author: 'Priya S', quote: 'Absolutely stunning work.' },
  }), 200);
  expectStatus(await call('DELETE', `/content/testimonials/${t.body.data.testimonial._id}`, { token: tokens.admin }), 204);

  const post = await call('POST', '/content/blog', {
    token: tokens.admin,
    body: {
      title: 'Caring for Gold', excerpt: 'How to keep gold shining.', content: 'Gold jewellery care tips and tricks for daily wear.',
      coverImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', tags: ['Care'], isPublished: true,
    },
  });
  expectStatus(post, 201);
  const slug = post.body.data.post.slug;
  const one = await call('GET', `/content/blog/${slug}`);
  expectStatus(one, 200);
  assert.equal(one.body.data.post.targetKeyword, undefined, 'editorial fields stay private');
  const search = await call('GET', '/content/blog?q=gold');
  expectStatus(search, 200);
  assert.equal(search.body.data.items.length, 1);
  expectStatus(await call('GET', '/content/blog?tag=care'), 200);
  expectStatus(await call('PATCH', `/content/blog/${post.body.data.post._id}`, {
    token: tokens.admin,
    body: { title: 'Caring for Gold', excerpt: 'How to keep gold shining.', content: 'Updated content about caring for gold.', coverImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
  }), 200);
  expectStatus(await call('DELETE', `/content/blog/${post.body.data.post._id}`, { token: tokens.admin }), 204);

  const s = await call('PATCH', '/content/settings', { token: tokens.admin, body: { siteName: 'Aurelia E2E', key: 'hack' } });
  expectStatus(s, 200);
  assert.equal(s.body.data.settings.siteName, 'Aurelia E2E');
  assert.equal(s.body.data.settings.key, 'main');
});

test('blog workflow: draft → private preview → publish → rename → unpublish', async () => {
  const body = {
    title: 'How to Measure Ring Size at Home',
    excerpt: 'A practical guide to finding your ring size.',
    content: '<h1>Heading</h1><p>Use a <a href="/ring-size-finder">size finder</a> or <a href="https://example.com/x">chart</a>.</p><script>alert(1)</script><p onclick="x()">Tip</p><a href="javascript:alert(1)">bad</a>',
    targetKeyword: 'measure ring size at home',
    relatedProducts: ['Some-Ring'],
    relatedCollections: [{ label: 'Rings', href: '/rings' }],
  };

  // New posts are drafts, invisible to the public API.
  const created = await call('POST', '/content/blog', { token: tokens.admin, body });
  expectStatus(created, 201);
  const draft = created.body.data.post;
  assert.equal(draft.isPublished, false);
  assert.equal(draft.publishedAt, null);
  assert.equal(draft.slug, 'how-to-measure-ring-size-at-home');
  assert.deepEqual(draft.relatedProducts, ['some-ring']);

  // Editor HTML is sanitised: no script, handlers or javascript: URLs; H1 → H2;
  // internal links stay relative; external links get rel=noopener.
  assert.doesNotMatch(draft.content, /<script|onclick|javascript:|<h1/i);
  assert.match(draft.content, /<h2>Heading<\/h2>/);
  assert.match(draft.content, /href="\/ring-size-finder"/);
  assert.match(draft.content, /href="https:\/\/example.com\/x" target="_blank" rel="noopener noreferrer"/);

  expectStatus(await call('GET', `/content/blog/${draft.slug}`), 404, 'draft public read');
  assert.equal((await call('GET', '/content/blog')).body.data.items.some((p) => p._id === draft._id), false);

  // Preview: admins only.
  expectStatus(await call('GET', `/content/blog/admin/posts/${draft._id}`), 401, 'anon preview');
  expectStatus(await call('GET', `/content/blog/admin/posts/${draft._id}`, { token: tokens.customer }), 403, 'customer preview');
  const preview = await call('GET', `/content/blog/admin/posts/${draft._id}`, { token: tokens.admin });
  expectStatus(preview, 200);
  assert.equal(preview.body.data.post.targetKeyword, 'measure ring size at home');
  const drafts = await call('GET', '/content/blog/admin/posts?status=draft', { token: tokens.admin });
  assert.ok(drafts.body.data.items.some((p) => p._id === draft._id));

  // Duplicate slugs are rejected.
  const dupe = await call('POST', '/content/blog', { token: tokens.admin, body: { ...body, slug: draft.slug } });
  expectStatus(dupe, 409, 'duplicate slug');

  // Publish → visible, publishedAt stamped.
  const pub = await call('PATCH', `/content/blog/${draft._id}`, { token: tokens.admin, body: { isPublished: true } });
  expectStatus(pub, 200);
  assert.ok(pub.body.data.post.publishedAt);
  expectStatus(await call('GET', `/content/blog/${draft.slug}`), 200, 'published read');
  assert.ok((await call('GET', '/content/blog')).body.data.items.some((p) => p._id === draft._id));

  // Renaming a published post keeps the old slug resolvable (→ redirect).
  const renamed = await call('PATCH', `/content/blog/${draft._id}`, { token: tokens.admin, body: { slug: 'ring-size-guide-india' } });
  expectStatus(renamed, 200);
  const viaOld = await call('GET', `/content/blog/${draft.slug}`);
  expectStatus(viaOld, 200, 'old slug');
  assert.equal(viaOld.body.data.post.slug, 'ring-size-guide-india');
  // The old slug is reserved — another post can't take it.
  expectStatus(await call('POST', '/content/blog', { token: tokens.admin, body: { ...body, slug: draft.slug } }), 409);

  // Unpublish → gone from the public API under both slugs.
  expectStatus(await call('PATCH', `/content/blog/${draft._id}`, { token: tokens.admin, body: { isPublished: false } }), 200);
  expectStatus(await call('GET', '/content/blog/ring-size-guide-india'), 404, 'unpublished read');
  expectStatus(await call('GET', `/content/blog/${draft.slug}`), 404, 'unpublished old slug');
  assert.equal((await call('GET', '/content/blog')).body.data.items.some((p) => p._id === draft._id), false);

  // Collection links must be site paths.
  expectStatus(await call('POST', '/content/blog', {
    token: tokens.admin, body: { ...body, slug: 'x-y', relatedCollections: [{ label: 'Evil', href: 'https://evil.example' }] },
  }), 400);

  expectStatus(await call('DELETE', `/content/blog/${draft._id}`, { token: tokens.admin }), 204);
});

test('products: renamed slug still resolves to the product', async () => {
  const p = await call('POST', '/products', { token: tokens.admin, body: productPayload({ name: 'E2E Slug Ring', slug: 'e2e-old-slug' }) });
  expectStatus(p, 201);
  const id = p.body.data.product._id;
  expectStatus(await call('PATCH', `/products/${id}`, { token: tokens.admin, body: { slug: 'e2e-new-slug' } }), 200);
  const viaOld = await call('GET', '/products/slug/e2e-old-slug');
  expectStatus(viaOld, 200);
  assert.equal(viaOld.body.data.product.slug, 'e2e-new-slug');
  expectStatus(await call('GET', '/products/slug/e2e-new-slug'), 200);
  // The storefront middleware's lookup: old slug → new; current slug → none.
  assert.equal((await call('GET', '/content/redirect?type=product&slug=e2e-old-slug')).body.data.to, 'e2e-new-slug');
  assert.equal((await call('GET', '/content/redirect?type=product&slug=e2e-new-slug')).body.data.to, null);
  assert.equal((await call('GET', '/content/redirect?type=blog&slug=e2e-old-slug')).body.data.to, null);
  expectStatus(await call('DELETE', `/products/${id}`, { token: tokens.admin }), 204);
});

test('admin: products CRUD + listing, search, facets, related', async () => {
  const p1 = await call('POST', '/products', { token: tokens.admin, body: productPayload({ name: 'E2E Diamond Solitaire', category: 'diamond', price: 4000, isBestseller: true }) });
  expectStatus(p1, 201);
  ids.product1 = p1.body.data.product._id;
  ids.product1Slug = p1.body.data.product.slug;

  const p2 = await call('POST', '/products', { token: tokens.admin, body: productPayload({ name: 'E2E Gold Band', price: 1500 }) });
  expectStatus(p2, 201);
  ids.product2 = p2.body.data.product._id;

  const p3 = await call('POST', '/products', { token: tokens.admin, body: productPayload({ name: 'E2E Doomed', price: 100 }) });
  expectStatus(p3, 201);

  expectStatus(await call('POST', '/products', { token: tokens.admin, body: { name: 'x' } }), 400, 'invalid product');

  const list = await call('GET', '/products?limit=2&sort=price');
  expectStatus(list, 200);
  assert.equal(list.body.data.items.length, 2);
  assert.equal(list.body.data.pagination.total, 3);

  const q = await call('GET', '/products?q=diamond');
  assert.equal(q.body.data.items.length, 1);
  expectStatus(await call('GET', `/products?q=${encodeURIComponent('(*[')}`), 200, 'regex-safe search');

  const byIds = await call('GET', `/products?ids=${ids.product1},${ids.product2},zzz`);
  assert.equal(byIds.body.data.items.length, 2);

  expectStatus(await call('GET', '/products?category=unobtainium'), 400);
  expectStatus(await call('GET', '/products?minPrice=1000&maxPrice=5000&isBestseller=true'), 200);

  const facets = await call('GET', '/products/facets');
  expectStatus(facets, 200);
  assert.ok(facets.body.data.facets.price.max >= 4000);

  expectStatus(await call('GET', `/products/${ids.product1}`), 200);
  expectStatus(await call('GET', `/products/slug/${ids.product1Slug}`), 200);
  const rel = await call('GET', `/products/slug/${ids.product1Slug}/related`);
  expectStatus(rel, 200);
  assert.ok(rel.body.data.items.every((x) => x._id !== ids.product1));
  expectStatus(await call('GET', '/products/slug/nope'), 404);
  expectStatus(await call('GET', '/products/000000000000000000000000'), 404);

  expectStatus(await call('PATCH', `/products/${ids.product2}`, { token: tokens.admin, body: { price: 1600 } }), 200);
  expectStatus(await call('DELETE', `/products/${p3.body.data.product._id}`, { token: tokens.admin }), 204);
  expectStatus(await call('DELETE', `/products/${p3.body.data.product._id}`, { token: tokens.admin }), 404);
});

test('uploads: no file is rejected cleanly (400, or 503 without Cloudinary keys)', async () => {
  const r = await call('POST', '/uploads', { token: tokens.admin });
  assert.ok([400, 503].includes(r.status), `got ${r.status}`);
});

/* ───────────────────────── Customer flows ───────────────────────── */

test('profile and address book', async () => {
  const me = await call('GET', '/users/me', { token: tokens.customer });
  expectStatus(me, 200);
  const upd = await call('PATCH', '/users/me', { token: tokens.customer, body: { phone: '9876543210', ringSize: '12', role: 'admin' } });
  expectStatus(upd, 200);
  assert.equal(upd.body.data.user.role, 'customer', 'role must not be self-assignable');

  const a1 = await call('POST', '/users/addresses', { token: tokens.customer, body: address });
  expectStatus(a1, 201);
  assert.equal(a1.body.data.addresses[0].isDefault, true, 'first address becomes default');
  const a2 = await call('POST', '/users/addresses', { token: tokens.customer, body: { ...address, label: 'Work', isDefault: true } });
  expectStatus(a2, 201);
  const [first, second] = a2.body.data.addresses;
  assert.equal(first.isDefault, false);
  assert.equal(second.isDefault, true);

  expectStatus(await call('PATCH', `/users/addresses/${first._id}`, { token: tokens.customer, body: { ...address, city: 'Pune' } }), 200);
  expectStatus(await call('POST', '/users/addresses', { token: tokens.customer, body: { ...address, pincode: '12' } }), 400);
  const del = await call('DELETE', `/users/addresses/${second._id}`, { token: tokens.customer });
  expectStatus(del, 200);
  assert.equal(del.body.data.addresses[0].isDefault, true, 'default promoted after delete');
  expectStatus(await call('DELETE', `/users/addresses/${second._id}`, { token: tokens.customer }), 404);
  expectStatus(await call('GET', '/users/addresses', { token: tokens.customer }), 200);
});

test('wishlist toggle / remove / clear', async () => {
  const t1 = await call('POST', `/wishlist/toggle/${ids.product1}`, { token: tokens.customer });
  expectStatus(t1, 200);
  assert.equal(t1.body.data.added, true);
  const t2 = await call('POST', `/wishlist/toggle/${ids.product1}`, { token: tokens.customer });
  assert.equal(t2.body.data.added, false);
  await call('POST', `/wishlist/toggle/${ids.product1}`, { token: tokens.customer });
  await call('POST', `/wishlist/toggle/${ids.product2}`, { token: tokens.customer });

  const rm = await call('DELETE', `/wishlist/${ids.product1}`, { token: tokens.customer });
  expectStatus(rm, 200);
  assert.equal(rm.body.data.wishlist.products.length, 1);
  expectStatus(await call('POST', '/wishlist/toggle/000000000000000000000000', { token: tokens.customer }), 404);
  expectStatus(await call('DELETE', '/wishlist', { token: tokens.customer }), 204);
  const w = await call('GET', '/wishlist', { token: tokens.customer });
  assert.equal(w.body.data.wishlist.products.length, 0);
});

test('cart: add, merge, update, coupons, engraving, custom ring, remove, clear', async () => {
  const add = await call('POST', '/cart/items', { token: tokens.customer, body: { productId: ids.product1, quantity: 1, size: '12' } });
  expectStatus(add, 200);
  const merged = await call('POST', '/cart/items', { token: tokens.customer, body: { productId: ids.product1, quantity: 1, size: '12' } });
  assert.equal(merged.body.data.cart.items.length, 1);
  assert.equal(merged.body.data.cart.items[0].quantity, 2);
  const itemId = merged.body.data.cart.items[0]._id;

  expectStatus(await call('POST', '/cart/items', { token: tokens.customer, body: { productId: ids.product1, quantity: 50 } }), 400, 'qty > 20');
  expectStatus(await call('POST', '/cart/items', { token: tokens.customer, body: { productId: '000000000000000000000000' } }), 404);

  const upd = await call('PATCH', `/cart/items/${itemId}`, { token: tokens.customer, body: { quantity: 3 } });
  expectStatus(upd, 200);
  assert.equal(upd.body.data.cart.subtotal, 12000);

  const c1 = await call('POST', '/cart/coupon', { token: tokens.customer, body: { code: 'welcome10' } });
  expectStatus(c1, 200);
  assert.equal(c1.body.data.cart.couponDiscount, 1200);
  expectStatus(await call('POST', '/cart/coupon', { token: tokens.customer, body: { code: 'BOGUS' } }), 400);
  expectStatus(await call('DELETE', '/cart/coupon', { token: tokens.customer }), 200);

  const eng = await call('POST', '/cart/items', {
    token: tokens.customer, body: { productId: ids.product2, customisation: { type: 'engraving', engraving: 'Forever' } },
  });
  expectStatus(eng, 200);
  assert.equal(eng.body.data.cart.items.length, 2);

  const ring = await call('POST', '/cart/items', {
    token: tokens.customer, body: { productId: ids.product2, customisation: { type: 'custom-ring', ring: ids.ringConfig } },
  });
  expectStatus(ring, 200, 'custom ring');
  assert.equal(ring.body.data.cart.items.length, 3);

  const rm = await call('DELETE', `/cart/items/${itemId}`, { token: tokens.customer });
  expectStatus(rm, 200);
  expectStatus(await call('DELETE', `/cart/items/${itemId}`, { token: tokens.customer }), 404);
  expectStatus(await call('DELETE', '/cart', { token: tokens.customer }), 204);
  const empty = await call('GET', '/cart', { token: tokens.customer });
  assert.equal(empty.body.data.cart.items.length, 0);
});

test('cart survives a product being deleted while in the cart', async () => {
  const doomed = await call('POST', '/products', { token: tokens.admin, body: productPayload({ name: 'E2E Ephemeral' }) });
  await call('POST', '/cart/items', { token: tokens.customer, body: { productId: doomed.body.data.product._id } });
  await call('DELETE', `/products/${doomed.body.data.product._id}`, { token: tokens.admin });

  const cart = await call('GET', '/cart', { token: tokens.customer });
  expectStatus(cart, 200);
  assert.equal(cart.body.data.cart.items.length, 0, 'orphaned line dropped');
  // And adding another product afterwards must not crash on the orphan.
  expectStatus(await call('POST', '/cart/items', { token: tokens.customer, body: { productId: ids.product2 } }), 200);
  await call('DELETE', '/cart', { token: tokens.customer });
});

test('orders: from cart with coupon, direct items, list, get, cancel restores stock', async () => {
  const before = (await Product.findById(ids.product1)).stockQty;

  await call('POST', '/cart/items', { token: tokens.customer, body: { productId: ids.product1, quantity: 2 } });
  await call('POST', '/cart/coupon', { token: tokens.customer, body: { code: 'FLAT500' } });
  // Shrink the cart below the FLAT500 minimum: the discount must not survive.
  const cart = await call('GET', '/cart', { token: tokens.customer });
  await call('PATCH', `/cart/items/${cart.body.data.cart.items[0]._id}`, { token: tokens.customer, body: { quantity: 1 } });

  const order = await call('POST', '/orders', { token: tokens.customer, body: { shippingAddress: address, paymentMethod: 'cod' } });
  expectStatus(order, 201);
  const o = order.body.data.order;
  assert.equal(o.paymentStatus, 'pending');
  assert.equal(o.subtotal, 4000);
  assert.equal(o.discount, 0, 'stale FLAT500 discount must be recomputed against the final subtotal');
  assert.equal(o.total, 4000 + Math.round(4000 * 0.03));
  ids.order = o._id;
  ids.orderNumber = o.orderNumber;

  assert.equal((await Product.findById(ids.product1)).stockQty, before - 1, 'stock reserved');
  const emptied = await call('GET', '/cart', { token: tokens.customer });
  assert.equal(emptied.body.data.cart.items.length, 0, 'cart cleared after order');

  expectStatus(await call('POST', '/orders', { token: tokens.customer, body: { shippingAddress: address, paymentMethod: 'cod' } }), 400, 'empty cart');

  const direct = await call('POST', '/orders', {
    token: tokens.customer, body: { shippingAddress: address, paymentMethod: 'upi', items: [{ productId: ids.product2, quantity: 1 }] },
  });
  expectStatus(direct, 201);
  ids.order2 = direct.body.data.order._id;

  expectStatus(await call('POST', '/orders', {
    token: tokens.customer, body: { shippingAddress: address, paymentMethod: 'cod', items: [{ productId: ids.product2, quantity: 999 }] },
  }), 400, 'quantity validation');

  const mine = await call('GET', '/orders/my', { token: tokens.customer });
  expectStatus(mine, 200);
  assert.equal(mine.body.data.items.length, 2);
  expectStatus(await call('GET', `/orders/my/${ids.order}`, { token: tokens.customer }), 200);
  expectStatus(await call('GET', `/orders/my/${ids.orderNumber}`, { token: tokens.customer }), 200);
  expectStatus(await call('GET', `/orders/my/${ids.order}`, { token: tokens.admin }), 404, 'other users cannot read it');

  expectStatus(await call('POST', `/orders/my/${ids.order}/cancel`, { token: tokens.customer, body: { reason: 'x' } }), 400, 'reason too short');
  const cancel = await call('POST', `/orders/my/${ids.order}/cancel`, { token: tokens.customer, body: { reason: 'Changed my mind' } });
  expectStatus(cancel, 200);
  assert.equal((await Product.findById(ids.product1)).stockQty, before, 'stock restored');
  expectStatus(await call('POST', `/orders/my/${ids.order}/cancel`, { token: tokens.customer, body: { reason: 'Again please' } }), 400, 'double cancel');
});

test('payments: gateway disabled, failure marking, webhook signature', async () => {
  expectStatus(await call('POST', '/orders/payment/session', { token: tokens.customer, body: { orderId: ids.order2 } }), 503);
  expectStatus(await call('POST', '/orders/payment/failed', { token: tokens.customer, body: { orderId: ids.order2, reason: 'dismissed' } }), 200);

  const event = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_E2E', notes: { aureliaOrderId: ids.order2 } } } },
  });
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(event).digest('hex');

  expectStatus(await call('POST', '/orders/payment/webhook', {
    raw: event, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'bad' },
  }), 400, 'bad signature');

  const ok = await call('POST', '/orders/payment/webhook', {
    raw: event, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig },
  });
  expectStatus(ok, 200, 'valid webhook');
  assert.equal(ok.body.data.handled, true);
  const paid = await call('GET', `/orders/my/${ids.order2}`, { token: tokens.customer });
  assert.equal(paid.body.data.order.paymentStatus, 'paid');
});

test('admin: dashboard, orders, customers, order status', async () => {
  const dash = await call('GET', '/admin/dashboard', { token: tokens.admin });
  expectStatus(dash, 200);
  assert.equal(dash.body.data.summary.totalOrders, 2);

  const orders = await call('GET', '/admin/orders?status=cancelled', { token: tokens.admin });
  assert.equal(orders.body.data.items.length, 1);
  const byEmail = await call('GET', '/admin/orders?userEmail=cust@example.com', { token: tokens.admin });
  assert.equal(byEmail.body.data.items.length, 2);
  expectStatus(await call('GET', `/admin/orders/${ids.orderNumber}`, { token: tokens.admin }), 200);

  // A second customer so pagination is observable.
  await call('POST', '/auth/register', { body: { firstName: 'Second', email: 'second@example.com', password: 'SecondPass1' } });
  const page = await call('GET', '/admin/customers?limit=1', { token: tokens.admin });
  expectStatus(page, 200);
  assert.equal(page.body.data.pagination.total, 2);
  assert.equal(page.body.data.items.length, 1, 'customers list must honour limit');
  assert.ok(page.body.data.items.every((u) => u.password === undefined));

  const partial = await call('GET', '/admin/customers?email=SECOND', { token: tokens.admin });
  expectStatus(partial, 200, 'partial email search');
  assert.equal(partial.body.data.items.length, 1);
  expectStatus(await call('GET', `/admin/customers?email=${encodeURIComponent('(')}`, { token: tokens.admin }), 200, 'regex-safe');

  expectStatus(await call('GET', `/admin/customers/${ids.customer}`, { token: tokens.admin }), 200);
  expectStatus(await call('PATCH', `/admin/customers/${ids.customer}`, { token: tokens.admin, body: { firstName: 'Renamed' } }), 200);

  expectStatus(await call('PATCH', `/orders/${ids.order2}/status`, { token: tokens.admin, body: { status: 'teleported' } }), 400, 'invalid status');
  expectStatus(await call('PATCH', `/orders/${ids.order2}/status`, { token: tokens.admin, body: {} }), 400, 'missing status');
  const shipped = await call('PATCH', `/orders/${ids.order2}/status`, { token: tokens.admin, body: { status: 'delivered', note: 'Handed over' } });
  expectStatus(shipped, 200);
  assert.ok(shipped.body.data.order.deliveredAt);
  expectStatus(await call('PATCH', `/orders/${ids.order2}/status`, { token: tokens.customer, body: { status: 'shipped' } }), 403);
});

test('digital gold: enrol, list, get, pay installment', async () => {
  expectStatus(await call('POST', '/digital-gold/enrol', { token: tokens.customer, body: { monthlyAmount: 100, tenureMonths: 10 } }), 400);
  const plan = await call('POST', '/digital-gold/enrol', { token: tokens.customer, body: { monthlyAmount: 1000, tenureMonths: 6 } });
  expectStatus(plan, 201);
  const id = plan.body.data.plan._id;
  assert.equal(plan.body.data.plan.installments.length, 6);

  const list = await call('GET', '/digital-gold/my-plans', { token: tokens.customer });
  assert.equal(list.body.data.plans.length, 1);
  expectStatus(await call('GET', `/digital-gold/my-plans/${id}`, { token: tokens.customer }), 200);
  expectStatus(await call('POST', `/digital-gold/my-plans/${id}/installments/2/pay`, { token: tokens.customer }), 200);
  expectStatus(await call('POST', `/digital-gold/my-plans/${id}/installments/2/pay`, { token: tokens.customer }), 400, 'already paid');
  expectStatus(await call('POST', `/digital-gold/my-plans/${id}/installments/99/pay`, { token: tokens.customer }), 404);
  expectStatus(await call('GET', `/digital-gold/my-plans/${id}`, { token: tokens.admin }), 404, 'not your plan');
});

test('deactivated users are locked out', async () => {
  await call('PATCH', `/admin/customers/${ids.customer}`, { token: tokens.admin, body: { isActive: false } });
  expectStatus(await call('GET', '/auth/me', { token: tokens.customer }), 401);
  expectStatus(await call('POST', '/auth/login', { body: { email: 'cust@example.com', password: 'NewPass12345' } }), 403);
});
