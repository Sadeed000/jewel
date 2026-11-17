'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, tokenStore, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { User } from '@/lib/types';

interface AuthResponse {
  user: User;
  token: string;
}

interface RegisterPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Fetch the currently logged-in user. Returns null if no token is stored,
 * which prevents a noisy 401 request on every guest page-load.
 */
// src/hooks/useAuth.ts
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      if (!tokenStore.get()) return null;

      try {
        const data = await api.get<{ user: User }>('/auth/me');
        return data.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          return null;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
    onSuccess: (data) => {
      tokenStore.set(data.token);
      qc.setQueryData(queryKeys.auth.me, data.user);
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      qc.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
    onSuccess: (data) => {
      tokenStore.set(data.token);
      qc.setQueryData(queryKeys.auth.me, data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<null>('/auth/logout'),
    onSuccess: () => {
      tokenStore.clear();
      qc.setQueryData(queryKeys.auth.me, null);
      // Clear personalised data
      qc.removeQueries({ queryKey: queryKeys.cart.all });
      qc.removeQueries({ queryKey: queryKeys.wishlist.all });
      qc.removeQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.patch<AuthResponse>('/auth/update-password', payload),
    onSuccess: (data) => {
      tokenStore.set(data.token);
    },
  });
}
