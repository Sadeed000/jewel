'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Product slug, so the guest cart can link back to the product page. */
  slug?: string;
  size?: string;
  weight?: string;
  quantity: number;
}

/**
 * Stable identity for a guest cart line: product + size.
 * Exported so the unified cart layer can address guest and server items the
 * same way.
 */
export const guestItemKey = (item: Pick<CartItem, 'id' | 'size'>) =>
  `${item.id}::${item.size || ''}`;

/**
 * Accepts either the composite key or a bare product id, so callers written
 * against the original id-only API keep working.
 */
const matchesKey = (item: CartItem, key: string) =>
  guestItemKey(item) === key || item.id === key;

interface CartState {
  items: CartItem[];
  wishlist: string[];
  /** `quantity` defaults to 1 so existing single-argument callers are unaffected. */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          // Match on product *and* size, mirroring the server cart — otherwise
          // the same ring in two sizes collapses into a single line item.
          const existing = state.items.find(
            (i) => i.id === item.id && (i.size || '') === (item.size || '')
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing
                  ? { ...i, quantity: Math.min(20, i.quantity + quantity) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(20, quantity) }],
          };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => !matchesKey(i, id)) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (matchesKey(i, id) ? { ...i, quantity: Math.min(20, quantity) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((w) => w !== id)
            : [...state.wishlist, id],
        })),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'aurelia-cart' }
  )
);
