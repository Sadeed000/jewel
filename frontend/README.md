# Aurelia — Fine Jewellery Storefront

A production-ready Next.js 14 e-commerce storefront for a luxury jewellery brand. Built with App Router, Tailwind CSS, Zustand for state, and TypeScript throughout.

> **Note:** This is an original, branded "Aurelia" storefront. The design language draws inspiration from refined Indian luxury jewellery aesthetics (gold/maroon/cream palette, elegant serif typography, generous whitespace). Logo, brand name, and copy are original. Imagery is sourced from Unsplash.

## Tech Stack

- **Framework**: Next.js 14 (App Router, RSC where possible)
- **Styling**: Tailwind CSS with custom design tokens
- **State**: Zustand (cart + wishlist with localStorage persistence)
- **Icons**: lucide-react
- **Animations**: Framer Motion + CSS
- **Type safety**: TypeScript
- **Fonts**: Cormorant Garamond (display) + Inter (body) via `next/font`

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # lint
```

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (header, footer, fonts, metadata)
│   ├── page.tsx             # Home page composition
│   ├── globals.css          # Design tokens, Tailwind layers
│   ├── sitemap.ts           # Dynamic sitemap
│   ├── robots.ts            # Robots policy
│   ├── not-found.tsx        # 404
│   ├── shop/[category]/     # Category listing pages (dynamic)
│   ├── product/[slug]/      # Product detail pages (dynamic)
│   ├── cart/                # Shopping bag
│   ├── checkout/            # 4-step checkout flow
│   ├── order-confirmation/  # Post-purchase
│   ├── wishlist/            # Saved items
│   ├── search/              # Search results
│   ├── image-search/        # Search-with-a-pic
│   ├── virtual-try-on/      # AR try-on landing
│   ├── digital-gold/        # Digital gold + Golden Harvest calculator
│   ├── store-locator/       # Boutique finder w/ map placeholder
│   ├── help/                # FAQ + contact
│   ├── about/               # About / heritage
│   ├── blog/                # Stories / editorial
│   └── account/             # User dashboard + login
├── components/
│   ├── layout/              # Header, Footer, MegaMenu, UtilityBar
│   ├── home/                # Hero, ProductCarousel, CategoryTiles, etc.
│   ├── product/             # ProductCard, FilterSidebar
│   └── common/              # Logo, Breadcrumb
├── data/
│   └── products.ts          # Sample product catalogue
└── lib/
    ├── store.ts             # Zustand cart store
    └── utils.ts             # cn(), formatPrice(), etc.
```

## Design Tokens

Defined in `tailwind.config.js` and CSS variables in `globals.css`:

| Token | Value | Use |
|---|---|---|
| `brand.maroon` | `#5a1a1a` | Primary actions, navigation |
| `brand.maroon-dark` | `#3d0f0f` | Footer, hero overlays |
| `brand.gold` | `#d5aa72` | Accents, hover states |
| `brand.cream` | `#fdfbf7` | Page background |
| `brand.cream-dark` | `#f7f1e6` | Surface, borders |
| `brand.ink` | `#1a1a1a` | Body text |

## Pages Implemented

✅ Home (hero carousel, gold ticker, category tiles, collections, product carousels, trust badges, newsletter)
✅ Category listing with filters & pagination
✅ Product detail (gallery, price breakdown, size selector, pincode check, accordion tabs, related products)
✅ Cart & 4-step checkout (Login → Address → Payment → Review)
✅ Order confirmation
✅ Wishlist
✅ My Account dashboard (Overview, Orders, Profile, Address, Payments, Digital Gold, etc.)
✅ Search results
✅ Image search
✅ Virtual Try-On hub
✅ Digital Gold + Golden Harvest calculator
✅ Store locator with map placeholder
✅ Help & Contact (FAQ accordion)
✅ About / Our Story
✅ Blog / Stories
✅ Login / Register
✅ 404
✅ Sitemap.xml + robots.txt

## SEO

- Per-page `<title>` and `<meta description>` via Next.js Metadata API
- Semantic HTML (`<nav>`, `<main>`, `<aside>`, `<article>`, breadcrumbs)
- Dynamic `sitemap.ts` covering static + product URLs
- `robots.ts` with appropriate disallow rules
- OpenGraph defaults in root layout
- Image `alt` text everywhere
- ARIA labels on icon-only buttons

To add JSON-LD `Product` and `BreadcrumbList` schema, drop a `<script type="application/ld+json">` into the relevant page — example skeleton in `src/app/product/[slug]/page.tsx` ready to extend.

## Accessibility

- Keyboard navigation on all interactive elements
- Visible focus rings via `:focus-visible`
- ARIA labels for icon buttons
- Sufficient colour contrast (maroon on cream meets WCAG AA)

## What's Wired vs. Stubbed

**Real**: cart state (persisted), wishlist, multi-step checkout UI, all routing, mega menu, filters UI, FAQ accordion, gold rate ticker, calculator on Digital Gold page.

**Stubbed (intentional — easy hookups)**: payment gateway, real map (Google Maps / Mapbox), AR/WebXR try-on, image-recognition API, auth (NextAuth ready to drop in), product database (currently `src/data/products.ts`).

## Next Steps

1. **Backend**: swap `src/data/products.ts` for an API or CMS (Sanity, Contentful, Shopify Storefront API, or your own).
2. **Auth**: install `next-auth` and replace stub login forms.
3. **Payments**: integrate Razorpay / Stripe in `src/app/checkout/page.tsx`.
4. **Maps**: replace placeholder in `src/app/store-locator/page.tsx` with Google Maps Embed API.
5. **i18n**: wrap with `next-intl` for English/Hindi toggle.
6. **Tests**: add Vitest + React Testing Library.

## License

MIT — original code by you. Replace placeholder images and brand name before going live.
