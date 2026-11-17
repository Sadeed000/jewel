'use client';

import { useState } from 'react';
import { Edit3, Search, ArrowRight } from 'lucide-react';
import { useAdminCustomers, useUpdateCustomer } from '@/hooks/useAdmin';
import { SectionLoader, ErrorState, EmptyState } from '@/components/common/Loading';
import { formatPrice } from '@/lib/utils';
import type { User } from '@/lib/types';

export default function AdminCustomersPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [role, setRole] = useState<User['role']>('customer');
  const [isActive, setIsActive] = useState(true);
  const { data, isLoading, error, refetch } = useAdminCustomers({ email: searchEmail || undefined, limit: 20 });
  const updateCustomer = useUpdateCustomer();

  const handleSelect = (customer: User) => {
    setSelectedCustomer(customer);
    setRole(customer.role);
    setIsActive(customer.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    await updateCustomer.mutateAsync({ id: selectedCustomer._id, payload: { role, isActive } });
    setSelectedCustomer(null);
    refetch();
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-brand-muted">Customers</p>
            <h1 className="font-display text-3xl text-brand-ink">Customer management</h1>
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-brand-cream-dark bg-white px-4 py-3">
            <Search size={16} className="text-brand-maroon" />
            <input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by email"
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-brand-maroon px-4 py-2 text-xs font-semibold text-white hover:bg-brand-maroon-dark"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {selectedCustomer && (
        <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-brand-ink">Update customer</h2>
              <p className="text-sm text-brand-muted">{selectedCustomer.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="rounded-full border border-brand-cream-dark bg-white px-4 py-2 text-sm text-brand-ink hover:bg-brand-cream"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <label className="text-sm text-brand-muted block">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as User['role'])}
                className="mt-2 w-full rounded-2xl border border-brand-cream-dark bg-brand-cream px-4 py-3 text-sm outline-none focus:border-brand-gold"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-muted">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active account
            </label>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-brand-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-brand-maroon-dark"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-brand-ink mb-4">Customer list</h2>

        {isLoading ? (
          <SectionLoader label="Loading customers…" />
        ) : error ? (
          <ErrorState title="Unable to load customers" description="Try again later." />
        ) : !data?.items.length ? (
          <EmptyState
            title="No customers found"
            description="Use the search box above or broaden your filters."
          />
        ) : (
          <div className="space-y-3">
            {data.items.map((customer) => (
              <div key={customer._id} className="rounded-3xl border border-brand-cream-dark p-4 grid gap-4 md:grid-cols-[1fr_auto] items-center">
                <div>
                  <p className="font-semibold text-brand-ink">{customer.firstName} {customer.lastName}</p>
                  <p className="text-sm text-brand-muted">{customer.email}</p>
                  <p className="text-sm text-brand-muted mt-1">{customer.role} • {customer.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end">
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs text-brand-maroon">{customer.addresses.length} addresses</span>
                  <button
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-cream-dark bg-white px-4 py-2 text-sm text-brand-maroon hover:bg-brand-cream"
                  >
                    <Edit3 size={14} /> Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
