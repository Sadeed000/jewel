# Aurelia Backend API

## Product media on Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`. Credentials stay on the backend. New admin uploads go directly from memory to Cloudinary; existing `/uploads/` URLs remain readable for older products.

- `POST /api/v1/uploads`: up to 10 images, 5 MB per image.
- `POST /api/v1/uploads/videos`: up to 3 MP4, WebM or MOV files, 50 MB per video.
- Both routes require an authenticated admin and accept multipart files under `files`.
- Responses contain secure Cloudinary URLs. Save video URLs in the product's `videos` array.
- Admin product forms support image and video uploads; product detail pages display the videos.

Run `node seeds/seedCloudinaryProducts.js` from `backend` to add the five prepared sample products. The script skips existing sample slugs, uploads each image before saving the product, and removes that new asset if saving fails. Sample products have illustrative prices and start out of stock until their actual specifications and stock are confirmed. It uses `MONGO_URI` from `backend/.env`.

Validate uploads and visual search with `node --test tests/cloudinary.test.js tests/imageSearch.test.js`.

Production-ready Node.js + Express + MongoDB backend for the Aurelia jewellery storefront frontend.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose 8
- **Auth**: JWT (httpOnly cookie + Bearer token)
- **Validation**: Joi
- **Security**: helmet, cors, express-mongo-sanitize, rate-limit, bcryptjs

## Folder Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/               # Thin HTTP handlers
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── wishlistController.js
│   ├── orderController.js
│   └── miscController.js      # stores, newsletter, contact, gold-rate, digital-gold
├── middlewares/
│   ├── auth.js                # protect, optionalAuth, restrictTo
│   ├── errorHandler.js        # Central error handler
│   ├── notFound.js            # 404 handler
│   └── validate.js            # Joi validation factory
├── models/                    # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Wishlist.js
│   ├── Order.js
│   ├── Store.js
│   ├── Newsletter.js
│   ├── Contact.js
│   └── DigitalGoldPlan.js
├── routes/                    # Module routers
│   ├── index.js               # Mounts all modules
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── wishlistRoutes.js
│   ├── orderRoutes.js
│   ├── storeRoutes.js
│   ├── newsletterRoutes.js
│   ├── contactRoutes.js
│   ├── goldRateRoutes.js
│   └── digitalGoldRoutes.js
├── services/                  # Business logic
│   ├── authService.js
│   ├── userService.js
│   ├── productService.js
│   ├── cartService.js
│   ├── wishlistService.js
│   ├── orderService.js
│   └── miscService.js
├── utils/
│   ├── AppError.js            # Operational error class
│   ├── apiResponse.js         # Standard response envelope
│   ├── catchAsync.js          # Async error wrapper
│   ├── jwt.js                 # Token sign/verify
│   └── pagination.js
├── validators/                # Joi schemas
│   ├── authValidator.js
│   ├── userValidator.js
│   ├── cartValidator.js
│   ├── orderValidator.js
│   └── miscValidators.js
├── seeds/
│   ├── seedProducts.js
│   └── seedStores.js
├── app.js                     # Express app + middleware
├── server.js                  # Entry point
├── package.json
├── .env.example
└── .gitignore
```

## Setup

### 1. Install

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
MONGODB_URI=mongodb://127.0.0.1:27017/aurelia
JWT_SECRET=replace_with_a_long_random_string_min_64_chars
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
```

### 3. Start MongoDB

Local:
```bash
mongod
```

Or use MongoDB Atlas — paste your connection string into `MONGODB_URI`.

### 4. Seed sample data

```bash
npm run seed         # seeds products
npm run seed:stores  # seeds boutiques
```

### 5. Run

```bash
npm run dev   # nodemon, auto-reload
npm start     # production
```

Server: `http://localhost:5000/api/v1/health`

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login |
| POST | `/logout` | — | Clear cookie |
| GET | `/me` | ✓ | Current user |
| PATCH | `/update-password` | ✓ | Change password |

### Users — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | ✓ | Profile |
| PATCH | `/me` | ✓ | Update profile (incl. ringSize) |
| GET | `/addresses` | ✓ | List addresses |
| POST | `/addresses` | ✓ | Add address |
| PATCH | `/addresses/:addressId` | ✓ | Update address |
| DELETE | `/addresses/:addressId` | ✓ | Delete address |

### Products — `/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List with filters & pagination |
| GET | `/facets` | — | Aggregated filter counts |
| GET | `/slug/:slug` | — | Product by slug |
| GET | `/slug/:slug/related` | — | Related products |
| GET | `/:id` | — | Product by Mongo id |
| POST | `/image-search` | — | Visual search — multipart photo under `image` |
| GET | `/image-search/status` | — | Fingerprint index state |
| POST | `/` | admin | Create |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

**Query params for `GET /products`:**
`page, limit, sort, category, type, occasion, gemstone, gender, minPrice, maxPrice, isBestseller, isNew, inStock, collection, q`

**Visual search — `POST /products/image-search`**

Multipart, one image under `image` (max 5 MB); optional `?limit=&category=&type=` narrow the
comparison set. Returns products ordered by visual similarity with a `matchScore` (1–99), plus
`detected` (metal tone, palette, inferred category/gemstone) and `suggested` refinement chips.

Matching is local: every catalogue image is reduced to a colour/tone/silhouette/edge fingerprint
(via `sharp`) and cached in `backend/.cache/image-index.json`. The index warms in the background at
boot and picks up new products on the next search. Uploaded photos are held in memory only — never
written to disk. Rate limited to 40 searches per 10 minutes per IP.

### Cart — `/cart` (auth required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get cart |
| POST | `/items` | Add item `{ productId, quantity, size? }` |
| PATCH | `/items/:itemId` | Update qty `{ quantity }` |
| DELETE | `/items/:itemId` | Remove item |
| DELETE | `/` | Clear cart |
| POST | `/coupon` | Apply `{ code }` |
| DELETE | `/coupon` | Remove coupon |

### Wishlist — `/wishlist` (auth required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get wishlist |
| POST | `/toggle/:productId` | Add or remove (toggle) |
| DELETE | `/:productId` | Remove |
| DELETE | `/` | Clear |

### Orders — `/orders` (auth required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Place order |
| GET | `/my` | My orders (paginated) |
| GET | `/my/:id` | Order by id or orderNumber |
| POST | `/my/:id/cancel` | Cancel `{ reason }` |
| PATCH | `/:id/status` | admin: update status |

### Stores — `/stores`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List stores (filters: city, q, lng/lat/radius) |
| GET | `/:slug` | Single store |

### Newsletter — `/newsletter`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/subscribe` | `{ email, source? }` |
| POST | `/unsubscribe` | `{ email }` |

### Contact — `/contact`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | `{ name, email, phone?, subject?, message }` |

### Gold Rate — `/gold-rate`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Current rates (cached 15 min) |

### Digital Gold — `/digital-gold`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/calculate?monthlyAmount=2000&tenureMonths=11` | — | Preview Golden Harvest payout |
| POST | `/enrol` | ✓ | Enrol in a plan |
| GET | `/my-plans` | ✓ | My plans |
| GET | `/my-plans/:id` | ✓ | Single plan |
| POST | `/my-plans/:id/installments/:month/pay` | ✓ | Pay an instalment |

---

## Response Format

Every endpoint returns one of:

**Success:**
```json
{
  "status": "success",
  "message": "Optional human-readable message",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": { "total": 51, "page": 1, "limit": 20, "pages": 3, "hasNext": true, "hasPrev": false }
  }
}
```

**Error:**
```json
{
  "status": "fail",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be a valid email" }
  ]
}
```

## Sample Requests

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Riya",
    "lastName": "Sharma",
    "email": "riya@example.com",
    "password": "secure-pass-123"
  }'
```

Response:
```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "user": { "_id": "...", "firstName": "Riya", "email": "riya@example.com", ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Browse products with filters
```bash
curl "http://localhost:5000/api/v1/products?category=gemstone&minPrice=20000&maxPrice=200000&page=1&limit=12&sort=-createdAt"
```

### Add to cart
```bash
curl -X POST http://localhost:5000/api/v1/cart/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "productId": "65ab12...", "quantity": 1, "size": "16" }'
```

### Place order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "firstName": "Riya", "phone": "+919999999999",
      "line1": "12 MG Road", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001"
    },
    "paymentMethod": "card"
  }'
```

---

## Connecting your Next.js Frontend

### 1. Add env var to frontend

In `jewelry-clone/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 2. Create an API client

Create `jewelry-clone/src/lib/api.ts`:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('aurelia-token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json.message || 'Request failed', json.details);
  }
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
```

### 3. Replace static data with API calls

**Products page** (e.g. `src/app/jewellery/page.tsx`):

```ts
// Before
import { products } from '@/data/products';

// After
import { api } from '@/lib/api';

async function getProducts() {
  return api.get<{ items: Product[]; pagination: any }>('/products?limit=24');
}

export default async function Page() {
  const { items } = await getProducts();
  // ...
}
```

**Login** (`src/app/account/login/page.tsx`):

```ts
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const { user, token } = await api.post('/auth/login', { email, password });
    localStorage.setItem('aurelia-token', token);
    router.push('/account');
  } catch (err) {
    setError(err.message);
  }
};
```

**Cart sync** — replace Zustand local-only store with one that syncs to backend when logged in:

```ts
const { cart } = await api.get('/cart');                              // load
await api.post('/cart/items', { productId, quantity, size });         // add
await api.patch(`/cart/items/${itemId}`, { quantity });               // update
await api.delete(`/cart/items/${itemId}`);                            // remove
```

### 4. CORS

The backend already allows `http://localhost:3000`. If you deploy the frontend to another origin, add it to `CORS_ORIGINS` in the backend `.env`:

```env
CORS_ORIGINS=http://localhost:3000,https://aurelia.vercel.app
```

---

## Security Features

- **Helmet** for security headers
- **CORS** whitelist (no wildcard in production)
- **express-mongo-sanitize** to prevent NoSQL injection
- **Rate limiting** — global + tighter limits on `/auth` (20 req / 15 min) and `/contact` (10 req / hr)
- **bcryptjs** with cost 12 for password hashing
- **JWT** with configurable expiry, httpOnly cookies, secure flag in production
- **Stripped fields** — passwords never returned, `__v` removed
- **Input validation** on every body / query via Joi
- **Generic error messages** in production to avoid leaking internals

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set a strong `JWT_SECRET` (64+ random chars)
- [ ] Use MongoDB Atlas or replica set with auth
- [ ] Set `CORS_ORIGINS` to your real frontend domain(s)
- [ ] Run behind a reverse proxy (nginx, Caddy) with TLS
- [ ] Use a process manager (PM2, systemd) or container orchestrator
- [ ] Enable logging aggregation (Datadog, Logtail, etc.)
- [ ] Set up monitoring on `/api/v1/health`
- [ ] Configure database backups
- [ ] Replace stub gold-rate cache with real provider
- [ ] Integrate real payment gateway (Razorpay/Stripe) in `orderService.createOrder`
- [ ] Add transactional emails (order confirmation, password reset)

## Scripts

```bash
npm start              # production
npm run dev            # development with nodemon
npm run seed           # seed products
npm run seed:stores    # seed stores
```

## License

MIT
