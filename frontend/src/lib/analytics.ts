/**
 * Google Analytics 4 events (ecommerce + blog attribution).
 *
 * Off by default: nothing loads and every call is a no-op until
 * NEXT_PUBLIC_GA_MEASUREMENT_ID (e.g. G-XXXXXXX) is set at build time.
 *
 * Events, using GA4's recommended ecommerce names so the built-in
 * Monetisation reports work without custom setup:
 *   view_item       product page view
 *   add_to_cart     successful add to bag
 *   purchase        order confirmation (deduplicated per order number)
 *   select_content  blog → product / collection click (content_type
 *                   "blog_to_product" or "blog_to_collection")
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';

type Gtag = (command: 'event', name: string, params?: Record<string, unknown>) => void;

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
}

export function track(name: string, params: Record<string, unknown> = {}) {
  if (!GA_ID || typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.('event', name, params);
}

export function trackViewItem(item: AnalyticsItem) {
  track('view_item', { currency: 'INR', value: item.price, items: [item] });
}

export function trackAddToCart(item: AnalyticsItem) {
  track('add_to_cart', { currency: 'INR', value: item.price * (item.quantity ?? 1), items: [item] });
}

/**
 * Sends `purchase` once per order. The confirmation page can be reloaded or
 * revisited from order history; GA would count each load as a new sale, so
 * the order number is remembered in localStorage. GA4 also de-duplicates on
 * transaction_id as a second line of defence.
 */
export function trackPurchaseOnce(order: {
  orderNumber: string;
  total: number;
  tax?: number;
  shippingFee?: number;
  items: AnalyticsItem[];
}) {
  if (!GA_ID || typeof window === 'undefined') return;
  const key = `ga-purchase-${order.orderNumber}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    // Storage blocked: still rely on GA's transaction_id de-duplication.
  }
  track('purchase', {
    transaction_id: order.orderNumber,
    currency: 'INR',
    value: order.total,
    tax: order.tax,
    shipping: order.shippingFee,
    items: order.items,
  });
}
