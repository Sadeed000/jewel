# Aurelia Jewellery — Frontend + Backend Integration Guide

## What's Been Done

### Backend (Complete)
✅ 5 new content models: Banner, Testimonial, BlogPost, SiteSettings, Category  
✅ Content service/controller/validators/routes  
✅ Seed script with sample data  
✅ All existing modules (products, cart, orders, auth, etc.)  
✅ Ready at `http://localhost:5000/api/v1`

### Frontend (Complete)
✅ TanStack React Query provider + devtools  
✅ API client with token storage (`src/lib/api.ts`)  
✅ Type definitions matching backend (`src/lib/types.ts`)  
✅ 7 reusable hooks: useAuth, useProducts, useCart, useWishlist, useOrders, useMisc, useSettings  
✅ Loading skeletons + empty states (`src/components/common/Loading.tsx`)  
✅ Updated components:
  - HeroCarousel: loads from backend banners with static fallback
  - GoldRateTicker: fetches live rates with static fallback
  - ExchangeNewsletter: subscribes via API
  - ProductCard: supports both static (id) and API (_id), wishlist via API when logged in
  - HomePage: uses dynamic carousels
  - Jewellery page: dynamic products with filters
  - Login/Register: real authentication
  - Help page: contact form submission
✅ No UI changes — frontend looks identical to before

## Quick Setup

### 1. Backend

```bash
cd backend
npm install

# Create .env (copy from .env.example)
cp .env.example .env
# Edit .env:
# - MONGODB_URI: your MongoDB connection (local or Atlas)
# - JWT_SECRET: long random string (min 64 chars)
# - CORS_ORIGINS: http://localhost:3000

# Start MongoDB (if local)
mongod

# Seed all data
npm run seed:all

# Run the server
npm run dev
# Server starts at http://localhost:5000/api/v1
```

### 2. Frontend

```bash
cd jewelry-clone
npm install

# Create .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1' >> .env.local

# Run dev server
npm run dev
# Frontend at http://localhost:3000
```

### 3. Test the integration

1. **Browse products** — http://localhost:3000/jewellery → fetches from API
2. **Open product detail** — http://localhost:3000/product/leaf-motif-gold-drop-earrings → loads live product + related
3. **Add to wishlist** — as guest, stays in browser; after login, syncs to backend
4. **Newsletter** — http://localhost:3000 → ExchangeNewsletter form submits to API
5. **Login** — http://localhost:3000/account/login → register/sign in with API
6. **Contact form** — http://localhost:3000/help → submit message via API

## Key Features Wired

### Products
- ✅ List with filters (category, type, price, occasion, gemstone, etc.)
- ✅ Single product by slug
- ✅ Related products
- ✅ Faceted filtering (count per category/occasion/etc.)
- ✅ Fallback to static data if backend down

### Authentication
- ✅ Register (email + password)
- ✅ Login (email + password)
- ✅ Logout
- ✅ Get current user
- ✅ Update password
- ✅ Token stored in localStorage + httpOnly cookie (backend)

### Cart
- ✅ Server cart (synced when logged in)
- ✅ Guest cart (local Zustand — untouched)
- ✅ Add/remove/update items
- ✅ Apply/remove coupons
- ✅ Clear cart

### Wishlist
- ✅ Server wishlist (logged-in users)
- ✅ Guest wishlist (local — untouched)
- ✅ Toggle product (add/remove)
- ✅ ProductCard auto-detects source

### Content (CMS)
- ✅ Banners (home hero, collections, etc.)
- ✅ Testimonials (featured, all)
- ✅ Blog posts (list, single, search)
- ✅ Site settings (logo, footer, social, about, trust badges)
- ✅ Categories (dynamic nav, mega menu)
- ✅ Gold rates (ticker with caching)

### Forms & Contact
- ✅ Newsletter signup (ExchangeNewsletter)
- ✅ Contact form (Help page)
- ✅ All with error/success states

## What Still Works (Unchanged)

✅ Static pages: About, Blog (meta only, can be wired to BlogPost model)  
✅ Store Locator (has hook `useStores` but page not wired yet)  
✅ Image Search ("Search With a Pic") — live: uploads to `POST /products/image-search` and ranks
the catalogue by visual similarity  
✅ Virtual Try-On, Digital Gold calculator (UI only, routes ready)  
✅ Cart & Checkout flow (cart syncs to backend, checkout form ready for order creation)  
✅ Account dashboard structure (ready for user data/orders)  
✅ All animations, styling, responsiveness — **zero changes**  
✅ Zustand cart for guest users — **untouched**

## Pages Needing Minor Wiring (Not Critical)

If you need full functionality for these:

1. **Account Dashboard** (`/account/page.tsx`)
   - Show user profile
   - Show order history
   - Address management
   
   ```tsx
   const { data: user } = useCurrentUser();
   const { data: orders } = useMyOrders();
   ```

2. **Checkout Final Step** (`/checkout/page.tsx`)
   - Submit order via API
   ```tsx
   const createOrder = useCreateOrder();
   await createOrder.mutateAsync({ shippingAddress, paymentMethod });
   ```

3. **Store Locator** (`/store-locator/page.tsx`)
   - Use `useStores({ city, q, lng, lat, radius })` hook
   
4. **Digital Gold** (`/digital-gold/page.tsx`)
   - Use `useGoldenHarvestCalc()` and `useEnrolGoldenHarvest()`

5. **Blog** (`/blog/page.tsx`)
   - Use `useBlogPosts()` and `useBlogPost(slug)`

## Database Seed Data

**Products:** 15 sample jewellery items (earrings, rings, mangalsutra, etc.)  
**Stores:** 6 boutiques across India (Jaipur, Mumbai, Delhi, Bangalore, Chennai, Hyderabad)  
**Banners:** 3 hero slides (Old Gold Exchange, Gemstones, Bridal)  
**Testimonials:** 4 featured customer quotes  
**Blog Posts:** 4 articles (bridal guide, gold purity, styling, care)  
**Categories:** 8 main categories with subcategories  
**Settings:** Site name, logo, footer, social links, about page, trust badges

## API Endpoints Reference

```
GET  /products?category=gold&type=earrings&limit=24&sort=-createdAt
GET  /products/:slug
GET  /products/:slug/related

POST /auth/register { firstName, email, password }
POST /auth/login { email, password }
GET  /auth/me

GET  /users/me
PATCH /users/me { firstName, phone, ringSize }
POST /users/addresses { firstName, phone, line1, city, state, pincode }

GET  /cart
POST /cart/items { productId, quantity, size }
POST /cart/coupon { code }

GET  /wishlist
POST /wishlist/toggle/:productId

GET  /orders/my
POST /orders { shippingAddress, paymentMethod, items? }

POST /newsletter/subscribe { email }
POST /contact { name, email, message }
GET  /gold-rate

GET  /content/banners?placement=home-hero
GET  /content/testimonials?featured=true
GET  /content/blog
GET  /content/settings
GET  /content/categories
```

## Token Management

**After Login:**
- Token stored in `localStorage` (key: `aurelia-token`)
- Token also in httpOnly cookie (set by backend)
- Sent as `Authorization: Bearer <token>` in all protected requests
- Cleared on logout

**If token expires:**
- React Query will retry once
- User redirected to login if 401
- Graceful fallback to guest mode

## Fallbacks & Offline

All dynamic pages have **static fallbacks**:
- No products returned → show first 24 from `data/products.ts`
- No banners → show 3 hardcoded hero slides
- No testimonials → show empty state (can add hardcoded ones)
- No gold rate → show cached rate or placeholder

This means:
✅ Site works even if backend is slow/down  
✅ Pages don't break on cold start  
✅ Guest browsing unaffected  

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/aurelia
JWT_SECRET=replace_with_64_char_random_string
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Production Deployment Checklist

### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (128 chars)
- [ ] Use MongoDB Atlas with auth
- [ ] Set `CORS_ORIGINS` to your domain(s)
- [ ] Deploy to Render, Railway, or Heroku
- [ ] Set up environment variables on platform
- [ ] Test all endpoints POST deploy

### Frontend
- [ ] Set `NEXT_PUBLIC_API_URL=https://your-api.com/api/v1`
- [ ] Deploy to Vercel, Netlify, or self-hosted
- [ ] Test login flow
- [ ] Test API calls from production domain
- [ ] Monitor for CORS issues

## Common Errors & Fixes

**"CORS error"** → Check CORS_ORIGINS in backend .env includes your frontend domain

**"404 on /api/v1/products"** → Backend not running or wrong API_URL in frontend

**"Can't login"** → Check MongoDB is running, JWT_SECRET is set

**"Product appears blank"** → Check images[0] is a valid image URL

**"Wishlist doesn't sync"** → User not logged in; it uses local Zustand then

**"Cart empties after refresh"** → Need to wire useServerCart hook to pages that fetch it

## Next Steps for Full Feature Parity

1. **Order Checkout** — Wire checkout page to `useCreateOrder` hook
2. **Order History** — Wire account dashboard to `useMyOrders`
3. **Address Book** — Implement address CRUD in account dashboard
4. **Blog Pages** — Wire blog list and single post pages
5. **Store Locator** — Show stores with geo search
6. **Digital Gold** — Calculator and enrolment forms
7. **Admin Panel** (optional) — CRUD for banners, products, orders, settings

All hooks are ready; it's just wiring them to the existing UI components.

---

**Questions?** Check the hook signatures in `src/hooks/` — each hook is fully typed with TSDoc comments.

**API docs?** Backend README at `backend/README.md` with curl examples.

**Need to add a field?** Update the Mongoose model, re-seed, then add to the TypeScript type in `src/lib/types.ts`.
