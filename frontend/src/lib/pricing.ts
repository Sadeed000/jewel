/**
 * Order total calculation.
 *
 * These constants and the order of operations mirror backend/services/
 * orderService.js exactly. The server is authoritative — this exists so the
 * checkout summary shows the same number the customer will actually be
 * charged. If you change one side, change the other.
 */

export const SHIPPING_FREE_THRESHOLD = 1000;
export const SHIPPING_FEE = 99;
export const TAX_RATE = 0.03;

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
}

export function calculateTotals(subtotal: number, discount = 0): OrderTotals {
  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingFee = afterDiscount >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(afterDiscount * TAX_RATE);

  return {
    subtotal,
    discount,
    shippingFee,
    tax,
    total: afterDiscount + shippingFee + tax,
  };
}
