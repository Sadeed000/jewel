'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DigitalGoldPlan, GoldRate, Paginated, Store } from '@/lib/types';
import { useCurrentUser } from './useAuth';

/* ───────────── Stores ───────────── */

export function useStores(filters: { city?: string; q?: string; lng?: number; lat?: number; radius?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.stores.list(filters as Record<string, unknown>),
    queryFn: () => api.get<Paginated<Store>>('/stores', filters as Record<string, string | number>),
  });
}

export function useStore(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stores.bySlug(slug ?? ''),
    queryFn: () => api.get<{ store: Store }>(`/stores/${slug}`).then((d) => d.store),
    enabled: !!slug,
  });
}

/* ───────────── Gold rate ───────────── */

export function useGoldRate() {
  return useQuery({
    queryKey: queryKeys.goldRate.current,
    queryFn: () => api.get<GoldRate>('/gold-rate'),
    // Gold rate is cached server-side for 15 min; client revalidates every 5 min.
    staleTime: 5 * 60 * 1000,
  });
}

/* ───────────── Newsletter ───────────── */

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (payload: { email: string; source?: string }) =>
      api.post<{ subscription: any }>('/newsletter/subscribe', payload),
  });
}

/* ───────────── Contact ───────────── */

export function useSubmitContact() {
  return useMutation({
    mutationFn: (payload: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
      api.post<{ submission: any }>('/contact', payload),
  });
}

/* ───────────── Digital Gold ───────────── */

export function useGoldenHarvestCalc(monthlyAmount: number, tenureMonths: number) {
  return useQuery({
    queryKey: queryKeys.digitalGold.calculate({ monthlyAmount, tenureMonths }),
    queryFn: () =>
      api.get<{
        monthlyAmount: number;
        tenureMonths: number;
        bonusPercent: number;
        totalCommitted: number;
        bonusAmount: number;
        totalValue: number;
      }>('/digital-gold/calculate', { monthlyAmount, tenureMonths }),
    enabled: monthlyAmount >= 500 && tenureMonths >= 6,
  });
}

export function useMyGoldenHarvestPlans() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.digitalGold.myPlans,
    queryFn: () => api.get<{ plans: DigitalGoldPlan[] }>('/digital-gold/my-plans').then((d) => d.plans),
    enabled: !!user,
  });
}

export function useEnrolGoldenHarvest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { monthlyAmount: number; tenureMonths: number }) =>
      api.post<{ plan: DigitalGoldPlan }>('/digital-gold/enrol', payload).then((d) => d.plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.digitalGold.myPlans }),
  });
}
