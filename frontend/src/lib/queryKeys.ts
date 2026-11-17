/**
 * Centralised React Query key factory.
 *
 * Keeping all keys in one place means cache invalidation is consistent —
 * e.g. addItem() in cart hook invalidates queryKeys.cart.all and we're sure
 * no cart query escapes the refresh.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => ['products', 'list', filters ?? {}] as const,
    bySlug: (slug: string) => ['products', 'slug', slug] as const,
    related: (slug: string) => ['products', 'related', slug] as const,
    facets: (filters?: Record<string, unknown>) => ['products', 'facets', filters ?? {}] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  wishlist: {
    all: ['wishlist'] as const,
  },
  orders: {
    all: ['orders'] as const,
    mine: (filters?: Record<string, unknown>) => ['orders', 'mine', filters ?? {}] as const,
    byId: (id: string) => ['orders', id] as const,
    paymentConfig: ['orders', 'payment-config'] as const,
  },
  stores: {
    list: (filters?: Record<string, unknown>) => ['stores', 'list', filters ?? {}] as const,
    bySlug: (slug: string) => ['stores', 'slug', slug] as const,
  },
  goldRate: {
    current: ['gold-rate'] as const,
  },
  digitalGold: {
    calculate: (params?: Record<string, unknown>) => ['digital-gold', 'calc', params] as const,
    myPlans: ['digital-gold', 'my-plans'] as const,
    plan: (id: string) => ['digital-gold', 'plan', id] as const,
  },
  content: {
    banners: (placement?: string) => ['content', 'banners', placement] as const,
    testimonials: (featured?: boolean) => ['content', 'testimonials', featured] as const,
    blog: (filters?: Record<string, unknown>) => ['content', 'blog', filters ?? {}] as const,
    blogPost: (slug: string) => ['content', 'blog', 'post', slug] as const,
    settings: ['content', 'settings'] as const,
    categories: (filters?: Record<string, unknown>) => ['content', 'categories', filters ?? {}] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    orders: (filters?: Record<string, unknown>) => ['admin', 'orders', filters ?? {}] as const,
    order: (id: string) => ['admin', 'order', id] as const,
    customers: (filters?: Record<string, unknown>) => ['admin', 'customers', filters ?? {}] as const,
    customer: (id: string) => ['admin', 'customer', id] as const,
    categories: ['admin', 'categories'] as const,
  },
};
