# Ratnapankh — SEO & Blog Handover

## 1. The domain setting

The public storefront origin lives in one setting: **`SITE_URL`**, stored in `frontend/.env.production`.

```
SITE_URL=https://ratnapankh.com
```

- **What it controls:** canonical tags, `og:url`, Twitter URLs, every structured-data URL, the `Sitemap:` line in robots.txt, and every sitemap entry.
- **What it does not touch:** internal links and links inserted in blog articles, which stay relative (`/rings`); media/CDN URLs, which are used exactly as stored.
- **Overrides:** a value set in the hosting environment overrides the file.
- **After changing it, rebuild and restart:** `cd frontend && npm run build && npm start` (or your host's redeploy). A restart alone is not enough, because pages are pre-rendered at build time.
- **Production rules (the build fails otherwise):**
  - https only
  - a bare origin, with no path
  - not localhost, a private IP, or a preview host (`*.vercel.app` etc.)
- **The request `Host` header is never used.** A spoofed host was tested and ignored.
- **Brand name:** it is separate from the domain (`NEXT_PUBLIC_SITE_NAME=Ratnapankh`), so changing the domain never requires renaming anything.
- **Code:** `frontend/src/lib/site.ts`, `frontend/src/lib/brand.ts`.

### Future domain move checklist (do not activate now)

1. **DNS:** point the new domain at the host, and keep the old domain resolving.
2. **HTTPS:** issue a certificate for the new domain, including the www/non-www variant you will redirect.
3. Set `SITE_URL` to the new origin, then rebuild and restart.
4. **Redirects:** on the old domain, configure 301/308 redirects that preserve the path (`old.com/<path>?<query>` → `new.com/<path>?<query>`), at the host or CDN. Never redirect everything to the homepage.
5. **Search Console:**
   - add and verify the new domain (a Domain property is best);
   - on the old property, use **Settings → Change of address**.
6. **Sitemap:** submit `https://new-domain/sitemap.xml` in the new property, and keep the old property for 6+ months to watch traffic transfer.
7. **Links and profiles:** update external profiles (Instagram, Google Business Profile, marketplaces) and any hard-coded links in emails.

## 2. Publishing a blog article (no code)

1. **Open the editor.** Go to **Admin → Content → Blog → New article**.
2. **Fill in the article:**
   - **Title.** The URL slug fills in automatically; you can edit it.
   - **Excerpt.**
   - **Body:** use **Heading** for sections and the 🔗 button to link products or collections with paths like `/rings`.
3. **Fill in the side panels:**
   - **Category and author.**
   - **Featured image:** upload one or paste a URL, then add alt text.
   - **Linked products:** search and add.
   - **Linked collections:** quick-add buttons.
4. **Optional: Search appearance.** Set an SEO title, meta description and target keyword. If left blank, the title and excerpt are used, and a live Google-style preview is shown.
5. **Save draft.** Drafts are invisible to the public, the public API and the sitemap.
6. **Preview** opens a private, admin-only page that looks exactly like the live article.
7. **Publish** (with confirmation). The article appears on `/blog`, at `/blog/<slug>` and in `sitemap.xml` immediately; the cache is purged automatically.
8. **Unpublish** (with confirmation) removes it from the blog and the sitemap, and its URL returns 404.

Renaming the slug of a published article automatically 308-redirects the old URL.

## 3. Indexing policy (collections, filters, pagination)

| URL | Indexed? | Canonical |
|---|---|---|
| `/shop/<collection>` | yes | itself |
| `/shop/<collection>?page=N` | yes | itself (with `?page=N`), so deep products stay discoverable |
| any filter / sort / `style` / `q` param | **noindex, follow** | the clean collection URL |
| `utm_*`, `gclid`, `fbclid` and other tracking params | ignored | the clean URL |
| `/shop/rings`, `/shop/earrings` (page 1) | yes | `/rings`, `/earrings` (the curated pages the navigation uses) |
| `/jewellery` | yes | `/shop/jewellery` (server-rendered list) |
| unknown collection, product or article | **404** | — |
| renamed product or article slug | **308** → new slug | — |
| cart, checkout, account, wishlist, order confirmation, search, image search, admin | noindex + robots disallow | — |

Product variants (sizes) are options on one product page, not separate URLs, so they don't create duplicates. The sitemap only lists collections that contain at least one product.

## 4. Keyword → page map (hypotheses — verify with Search Console)

**Read this first.** The live catalogue currently holds 6 placeholder products ("(Sample)", "not certified", "Silver-tone") plus one test record. No category documents exist. No real 925 silver, opal, gold-plated or moissanite products are listed yet. No Search Console data exists for ratnapankh.com in the connected account.

Nothing below is backed by search volume or ranking data. These are starting hypotheses: switch on the product mappings once the real products are uploaded with verified attributes.

### Priority collections

| Search intent (India) | Page | Title (live in code) |
|---|---|---|
| "925 silver rings for women", "silver rings online india" | `/rings` (and `/shop/silver`) | Rings for Women & Men – Shop Rings Online in India |
| "silver jewellery online india", "sterling silver jewellery" | `/shop/silver` | Silver Jewellery Online in India – Rings, Earrings & Pendants |
| "opal earrings", "drop earrings for women online" | `/earrings` | Earrings for Women – Drop, Stud & Gemstone Earrings Online |

Collection copy describes only what the catalogue proves. It deliberately does not claim 925 purity, certification or delivery times until the products carry them.

### Priority products (map once the real items exist)

| Intent | Page to create / map | Attributes that must be verified first |
|---|---|---|
| "pear shaped opal drop earrings 925 silver" | the real opal drop earrings (today: placeholder `sample-opal-style-drop-earrings`) | stone (natural, lab or simulated opal), metal and purity, drop length in mm |
| "925 silver band ring for women" | a real silver band ring | 925 hallmark/stamp, sizes stocked (Indian 10–16 etc.), weight |
| "gold plated silver ring" | a gold-plated sterling piece | base metal, plating type (gold vermeil / micron), care notes |
| "moissanite ring silver india" | a moissanite ring | stone size (mm/ct), whether a certificate is supplied |
| "heart pendant necklace silver" | the real heart pendant (today: placeholder `sample-heart-pendant-necklace`) | chain length, metal, closure |

Product titles, descriptions and structured data are generated from each product's own fields. Better product data in the admin therefore produces better search snippets automatically.

## 5. Eight-article plan

| # | Proposed title | Primary query (hypothesis) | Buyer question | Collection link |
|---|---|---|---|---|
| 1 | **How to Measure Your Ring Size at Home in India** *(saved as an unpublished draft)* | how to measure ring size at home in india | "Which size do I order?" | `/rings`, `/ring-size-finder` |
| 2 | Sterling Silver vs Gold-Plated Silver: Which Should You Buy? | 925 silver vs gold plated | "Which lasts longer and suits daily wear?" | `/shop/silver` |
| 3 | How to Care for Opal Earrings (and What to Avoid) | how to clean opal earrings | "Will water or perfume damage my opal?" | `/earrings` |
| 4 | How to Tell if Silver Jewellery Is Real 925 Sterling | how to check 925 silver | "How do I know it's genuine?" | `/shop/silver` |
| 5 | Moissanite vs Diamond: An Honest Buyer's Guide for India | moissanite vs diamond | "Is moissanite worth it?" | `/rings` |
| 6 | How to Stop Silver Jewellery Tarnishing in Humid Weather | how to stop silver from tarnishing | "Why does my silver turn black during the monsoon?" | `/shop/silver` |
| 7 | Indian, US and UK Ring Sizes Explained (Conversion Chart) | indian ring size chart | "I know my US size — what's my Indian size?" | `/ring-size-finder`, `/rings` |
| 8 | Choosing Earrings for Your Face Shape | earrings for round face | "Which earring style suits me?" | `/earrings` |

Publish about one article a week. Link every article to 1–2 collections and 2–4 real products.

## 6. Measurement

**GA4** (`frontend/src/lib/analytics.ts`) is off until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, followed by a rebuild. It sends:

- `view_item`
- `add_to_cart`
- `purchase`: sent once per order number, guarded in localStorage and also deduplicated by GA4 on `transaction_id`;
- `select_content`, with `content_type` set to `blog_to_product` or `blog_to_collection`.

### 30-day tracking plan

| Day | Action |
|---|---|
| 0 | **Verify the property:** a Domain property in Search Console. **Submit the sitemap:** `https://ratnapankh.com/sitemap.xml`. **Request indexing:** for the homepage, the 3 priority collections and the 5 priority products. **Turn on GA4:** create the GA4 property, set the measurement ID and link GA4 ↔ Search Console. |
| 0 | **Baseline (India):** in Search Console → Performance, filter **Country = India**, last 28 days, and export queries and pages. Repeat with "Country ≠ India" (or by country) for the international baseline. |
| 7 | **Coverage:** Pages report — check every sitemap URL is "Indexed" and look at the reasons for any that are not. **Structured data:** check the Product and Breadcrumb enhancement reports for errors. |
| 7 | **First data:** first India query list. Note pages with impressions but CTR < 1% and rewrite their SEO title and meta description. |
| 14 | **Positions 8–20:** find queries in positions 8–20 for India. Add an FAQ section or internal links from blog articles to those pages. Publish articles 2–3. |
| 21 | **GA4 check:** sessions with Default channel group = Organic Search, split by country (India vs others). Check `view_item` → `add_to_cart` → `purchase` from organic traffic, plus `select_content` blog clicks. |
| 30 | **Compare against day 0**, India and international separately: impressions, clicks, CTR, average position, organic product views, add-to-carts, purchases and revenue. Pick the next four articles from the queries that are rising. |

Track weekly, in one sheet:
- India impressions, clicks, CTR and position;
- top 20 India queries;
- organic product views, add-to-carts, purchases and revenue;
- the same figures for international traffic.
