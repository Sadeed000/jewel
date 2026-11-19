/**
 * Shared types matching the backend API response shapes.
 * Keep these in sync with the Mongoose models.
 */

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/* ────── User ────── */
export interface Address {
  _id: string;
  label: string;
  firstName: string;
  lastName?: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  addresses: Address[];
  ringSize?: string;
  encirclePoints: number;
  digitalGoldGrams: number;
  giftCardBalance: number;
  isActive: boolean;
  createdAt: string;
}

/* ────── Product ────── */
export interface Product {
  _id: string;
  slug: string;
  name: string;
  sku?: string;
  category: 'gold' | 'diamond' | 'gemstone' | 'platinum' | 'silver';
  type: 'rings' | 'earrings' | 'pendants' | 'necklaces' | 'chains' | 'bracelets' | 'mangalsutra' | 'bangles' | 'nose-pin';
  /** Sizes this piece is stocked in. Empty falls back to the type's standard scale. */
  sizes?: string[];
  price: number;
  originalPrice?: number;
  images: string[];
  coverImages: string[];
  detailedImages: string[];
  videos?: string[];
  /** Background-free PNG used as the virtual try-on overlay. */
  tryOnImage?: string;
  /** Provenance for stone-set pieces. */
  gemstoneDetails?: {
    caratWeight?: number;
    origin?: string;
    treatment?: 'none' | 'heated' | 'oiled' | 'diffused' | 'irradiated' | 'undisclosed';
    clarity?: string;
    cut?: string;
    stoneCount?: number;
  };
  certification?: {
    lab?: 'IGI' | 'GIA' | 'GII' | 'SGL' | 'IIGJ' | 'other';
    certificateNumber?: string;
    certificateUrl?: string;
    verifyUrl?: string;
  };
  bisHallmark?: boolean;
  freeResize?: boolean;
  engravingAvailable?: boolean;
  engravingMaxChars?: number;
  hidden?: boolean;
  /** Lets merchandising hide a supported piece from try-on. */
  tryOnEnabled?: boolean;
  metal: string;
  purity: string;
  weight: string;
  description: string;
  isBestseller?: boolean;
  isNew?: boolean;
  isExpertChoice?: boolean;
  inStock: boolean;
  onlyOneLeft?: boolean;
  stockQty?: number;
  collection?: string;
  occasion?: 'wedding' | 'daily-wear' | 'festive' | 'office' | 'party' | 'gifting';
  gemstone?: 'emerald' | 'ruby' | 'sapphire' | 'tanzanite' | 'pearl' | 'coral' | 'none';
  gender?: 'women' | 'men' | 'kids' | 'unisex';
  metalCharges?: number;
  makingCharges?: number;
  gst?: number;
  rating?: number;
  reviewCount?: number;
  discountPercent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  type?: string;
  occasion?: string;
  gemstone?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  isBestseller?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  /** Comma-separated product ids, for batch hydration (guest wishlist). */
  ids?: string;
  collection?: string;
  q?: string;
}

/* ────── Visual search ("Search With a Pic") ────── */
export interface ImageSearchMatch extends Product {
  /** 1–99: how close the piece is to the uploaded photo. */
  matchScore: number;
  matchKind?: 'same-image' | 'similar';
  matchedImage?: string;
}

export interface ImageSearchResult {
  items: ImageSearchMatch[];
  /** What the server read out of the photo — shown as chips, not applied as a filter. */
  detected: {
    tone: 'gold' | 'rose' | 'silver' | 'dark' | 'warm' | 'cool';
    toneLabel: string;
    category: string | null;
    gemstone: string | null;
    palette: Array<{ hex: string; share: number }>;
  };
  /** Products that carried a usable fingerprint, out of the whole catalogue. */
  indexed: number;
  catalogue: number;
  suggested: {
    category: string | null;
    gemstone: string | null;
    types: string[];
  };
}

/* ────── Cart ────── */
export interface CartItem {
  _id: string;
  product: Pick<Product, '_id' | 'slug' | 'name' | 'images' | 'inStock' | 'stockQty'>;
  quantity: number;
  size?: string;
  priceAtAdd: number;
  nameAtAdd: string;
  imageAtAdd: string;
  customisation?: Customisation;
}

export interface Customisation {
  type?: 'engraving' | 'custom-ring';
  engraving?: string;
  ring?: {
    stone?: string;
    carat?: number;
    metal?: string;
    setting?: string;
    size?: string;
  };
  summary?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  total: number;
  itemCount: number;
}

/* ────── Wishlist ────── */
export interface Wishlist {
  _id: string;
  user: string;
  products: Product[];
}

/* ────── Order ────── */
export interface OrderItem {
  _id: string;
  product: string;
  name: string;
  image: string;
  slug: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customisation?: Customisation;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: Omit<Address, '_id' | 'label' | 'isDefault'>;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'cod' | 'digital-gold' | 'gift-card';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'returned';
  statusHistory: Array<{ status: string; at: string; note?: string }>;
  estimatedDelivery: string;
  deliveredAt?: string;
  isGift?: boolean;
  giftNote?: string;
  createdAt: string;
}

/* ────── Banner ────── */
export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  highlight?: string;
  image: string;
  mobileImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
  placement: 'home-hero' | 'home-collections' | 'home-trending' | 'category-hero' | 'promo-strip';
  align: 'left' | 'center' | 'right';
}

/* ────── Testimonial ────── */
export interface Testimonial {
  _id: string;
  author: string;
  role?: string;
  avatar?: string;
  rating: number;
  quote: string;
}

/* ────── Blog ────── */
export interface BlogPost {
  _id: string;
  slug: string;
  previousSlugs?: string[];
  title: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  coverImageAlt?: string;
  category?: string;
  tags: string[];
  author: { name: string; avatar?: string };
  readTime: string;
  isPublished?: boolean;
  /** Null until first published. */
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
  /** Editorial planning only (admin API). */
  targetKeyword?: string;
  relatedProducts?: string[];
  relatedCollections?: { label: string; href: string }[];
}

/** Editable fields sent by the admin editor. */
export type BlogPostInput = Pick<
  BlogPost,
  'title' | 'slug' | 'excerpt' | 'content' | 'coverImage' | 'coverImageAlt' | 'category' |
  'author' | 'isPublished' | 'seo' | 'targetKeyword' | 'relatedProducts' | 'relatedCollections'
>;

/* ────── Site settings ────── */
export interface SiteSettings {
  _id: string;
  siteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail: string;
  contactPhone: string;
  supportHours: string;
  social: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    pinterest?: string;
  };
  footer: {
    about: string;
    shopLinks: Array<{ label: string; href: string }>;
    helpLinks: Array<{ label: string; href: string }>;
    policiesLinks: Array<{ label: string; href: string }>;
    copyright: string;
  };
  aboutPage: {
    heroTitle: string;
    heroSubtitle: string;
    heroImage?: string;
    body?: string;
    stats: Array<{ value: string; label: string }>;
  };
  trustBadges: Array<{ icon: string; title: string; subtitle: string }>;
  features: { digitalGold: boolean; virtualTryOn: boolean; storeLocator: boolean; blog: boolean };
}

/* ────── Category ────── */
export interface Category {
  _id: string;
  slug: string;
  name: string;
  icon?: string;
  image: string;
  description?: string;
  href?: string;
  subCategories: Array<{ _id: string; name: string; slug: string; image?: string; productType?: string }>;
  sortOrder: number;
  showInNav: boolean;
  showInMegaMenu: boolean;
}

/* ────── Store ────── */
export interface Store {
  _id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  hours: string;
  location: { type: 'Point'; coordinates: [number, number] };
  features: string[];
}

/* ────── Gold rate ────── */
export interface GoldRate {
  rates: Array<{ karat: string; price: number; unit: string; change: number }>;
  currency: string;
  updatedAt: string;
  source: string;
}

/* ────── Digital Gold plan ────── */
export interface DigitalGoldPlan {
  _id: string;
  planNumber: string;
  monthlyAmount: number;
  tenureMonths: number;
  bonusPercent: number;
  totalCommitted: number;
  bonusAmount: number;
  totalValue: number;
  installments: Array<{
    _id: string;
    monthNumber: number;
    amount: number;
    status: 'pending' | 'paid' | 'missed';
    paidAt?: string;
  }>;
  status: 'active' | 'completed' | 'matured' | 'cancelled';
  startDate: string;
  maturityDate: string;
}
