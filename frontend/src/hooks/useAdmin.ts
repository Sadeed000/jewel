'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Category, Order, Paginated, Product, User } from '@/lib/types';

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => api.get<{ summary: { totalOrders: number; totalCustomers: number; totalProducts: number; totalRevenue: number; statusCounts: Record<string, number>; } }>('/admin/dashboard'),
  });
}

export function useAdminOrders(filters: { page?: number; limit?: number; status?: string; orderNumber?: string; userEmail?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.orders(filters),
    queryFn: () => api.get<Paginated<Order>>('/admin/orders', filters),
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.order(id ?? ''),
    queryFn: () => api.get<{ order: Order }>(`/admin/orders/${id}`).then((d) => d.order),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: Order['status']; note?: string }) =>
      api.patch<{ order: Order }>(`/orders/${id}/status`, { status, note }).then((d) => d.order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useAdminCustomers(filters: { page?: number; limit?: number; role?: string; email?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.customers(filters),
    queryFn: () => api.get<Paginated<User>>('/admin/customers', filters),
  });
}

export function useAdminCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.customer(id ?? ''),
    queryFn: () => api.get<{ customer: User }>(`/admin/customers/${id}`).then((d) => d.customer),
    enabled: !!id,
  });
}

type AdminCustomerUpdatePayload = Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>> & {
  role?: User['role'];
  isActive?: boolean;
};

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminCustomerUpdatePayload }) =>
      api.patch<{ customer: User }>(`/admin/customers/${id}`, payload).then((d) => d.customer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.customers() });
      qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Product>) => api.post<{ product: Product }>('/products', payload).then((d) => d.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.list() }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) =>
      api.patch<{ product: Product }>(`/products/${id}`, payload).then((d) => d.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.list() }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<null>(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products.list() }),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => api.get<{ categories: Category[] }>('/content/categories').then((d) => d.categories),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Category>) => api.post<{ category: Category }>('/content/categories', payload).then((d) => d.category),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Category> }) =>
      api.patch<{ category: Category }>(`/content/categories/${id}`, payload).then((d) => d.category),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<null>(`/content/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.categories }),
  });
}
