'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Address, Order, Paginated, User } from '@/lib/types';
import { useCurrentUser } from './useAuth';

/* ───────────── Orders ───────────── */

export function useMyOrders(filters: { page?: number; limit?: number; status?: string } = {}) {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.orders.mine(filters),
    queryFn: () => api.get<Paginated<Order>>('/orders/my', filters),
    enabled: !!user,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.byId(id ?? ''),
    queryFn: () => api.get<{ order: Order }>(`/orders/my/${id}`).then((d) => d.order),
    enabled: !!id,
  });
}

interface CreateOrderPayload {
  shippingAddress: Omit<Address, '_id' | 'label' | 'isDefault'>;
  paymentMethod: Order['paymentMethod'];
  isGift?: boolean;
  giftNote?: string;
  items?: Array<{ productId: string; quantity: number; size?: string }>;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api.post<{ order: Order }>('/orders', payload).then((d) => d.order),
    onSuccess: () => {
      // After placing an order: cart is empty, order list needs refresh
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<{ order: Order }>(`/orders/my/${id}/cancel`, { reason }).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

/* ───────────── Payments ───────────── */

export interface PaymentConfig {
  razorpayEnabled: boolean;
  codEnabled: boolean;
}

/**
 * Which payment methods the server can actually process. Checkout uses this
 * to avoid offering an online option that would fail — if Razorpay keys
 * aren't configured, only COD is shown.
 */
export function usePaymentConfig() {
  return useQuery({
    queryKey: queryKeys.orders.paymentConfig,
    queryFn: () => api.get<PaymentConfig>('/orders/payment/config'),
    // Server config, not user data — cache it for the session.
    staleTime: 30 * 60 * 1000,
  });
}

export interface PaymentSession {
  gateway: 'razorpay';
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  orderId: string;
}

export function useCreatePaymentSession() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<{ session: PaymentSession }>('/orders/payment/session', { orderId })
        .then((d) => d.session),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      signature: string;
    }) => api.post<{ order: Order }>('/orders/payment/verify', payload).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

export function useMarkPaymentFailed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { orderId: string; reason?: string }) =>
      api.post<{ order: Order }>('/orders/payment/failed', payload).then((d) => d.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

/* ───────────── User profile + addresses ───────────── */

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'ringSize'>>) =>
      api.patch<{ user: User }>('/users/me', payload).then((d) => d.user),
    onSuccess: (user) => qc.setQueryData(queryKeys.auth.me, user),
  });
}

type AddressPayload = Omit<Address, '_id'>;

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressPayload) =>
      api.post<{ addresses: Address[] }>('/users/addresses', payload).then((d) => d.addresses),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddressPayload }) =>
      api.patch<{ addresses: Address[] }>(`/users/addresses/${id}`, payload).then((d) => d.addresses),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ addresses: Address[] }>(`/users/addresses/${id}`).then((d) => d.addresses),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}
