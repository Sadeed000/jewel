'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, X, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { useAdminCustomers, useUpdateCustomer } from '@/hooks/useAdmin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Button, Toggle } from '@/components/admin/FormControls';
import {
  PageHeader,
  Avatar,
  Chip,
  AdminSkeleton,
  AdminError,
  AdminEmpty,
  toolbarInput,
  segmentTab,
  formatDate,
} from '@/components/admin/ui';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

const PAGE_SIZE = 20;

const fullName = (u: User) => `${u.firstName} ${u.lastName ?? ''}`.trim();

export default function AdminCustomersPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role']>('customer');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [role, setRole] = useState<User['role']>('customer');
  const [isActive, setIsActive] = useState(true);
  // Debounced so typing doesn't fire a request per keystroke.
  const debouncedEmail = useDebouncedValue(searchEmail.trim(), 300);
  const { data, isLoading, error, refetch, isFetching } = useAdminCustomers({
    email: debouncedEmail || undefined,
    role: roleFilter,
    page,
    limit: PAGE_SIZE,
  });
  const updateCustomer = useUpdateCustomer();
  const confirm = useConfirm();
  const toast = useToast();

  // A new search or tab starts from the first page.
  useEffect(() => setPage(1), [debouncedEmail, roleFilter]);

  const handleSelect = (customer: User) => {
    setSelectedCustomer(customer);
    setRole(customer.role);
    setIsActive(customer.isActive);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    const name = fullName(selectedCustomer);

    // Deactivating locks the customer out; granting/revoking admin changes
    // what they can do. Both deserve an explicit confirmation.
    if (selectedCustomer.isActive && !isActive) {
      const ok = await confirm({
        title: `Deactivate ${name}?`,
        description: `${selectedCustomer.email} will be signed out and won't be able to log in until the account is re-activated.`,
        confirmLabel: 'Deactivate',
      });
      if (!ok) return;
    }
    if (selectedCustomer.role !== role) {
      const ok = await confirm({
        title: role === 'admin' ? `Make ${name} an admin?` : `Remove admin access for ${name}?`,
        description:
          role === 'admin'
            ? 'Admins can edit products, categories, orders and other customers.'
            : 'They will lose access to the admin dashboard immediately.',
        confirmLabel: role === 'admin' ? 'Grant admin' : 'Remove access',
        tone: role === 'admin' ? 'warning' : 'danger',
      });
      if (!ok) return;
    }

    try {
      await updateCustomer.mutateAsync({ id: selectedCustomer._id, payload: { role, isActive } });
      toast.success('Customer updated', { description: selectedCustomer.email });
      setSelectedCustomer(null);
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Could not update this customer.');
    }
  };

  const pagination = data?.pagination;
  const dirty = !!selectedCustomer && (selectedCustomer.role !== role || selectedCustomer.isActive !== isActive);

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description={pagination ? `${pagination.total.toLocaleString('en-IN')} ${roleFilter === 'admin' ? 'admin' : 'customer'} account${pagination.total === 1 ? '' : 's'}` : 'Accounts, access and activity'}
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-admin-line bg-admin-surface p-1 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          {(['customer', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={segmentTab(roleFilter === r)}
            >
              {r === 'customer' ? 'Customers' : 'Admins'}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search by email"
            aria-label="Search by email"
            className={cn(toolbarInput, 'w-full pl-10')}
          />
        </div>
      </div>

      {error ? (
        <AdminError title="Unable to load customers" message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <AdminSkeleton rows={6} />
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card">
          <AdminEmpty
            icon={Users}
            title="No accounts found"
            description={debouncedEmail ? 'No email matches that search.' : 'Accounts appear here once people register.'}
          />
        </div>
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card transition-opacity', isFetching && 'opacity-70')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-gradient-to-r from-admin-gold-soft to-admin-subtle text-[11px] font-bold uppercase tracking-[0.12em] text-admin-gold-ink">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5">Addresses</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {data.items.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-admin-subtle">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(c) || c.email} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-admin-ink">{fullName(c) || '—'}</p>
                          <p className="truncate text-xs text-admin-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-admin-body">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3.5 tabular-nums text-admin-body">{c.addresses?.length ?? 0}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <Chip tone={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'Active' : 'Inactive'}</Chip>
                        {c.role === 'admin' && <Chip tone="gold">Admin</Chip>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button variant="ghost" className="h-8 px-3 text-[13px]" onClick={() => handleSelect(c)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-admin-line px-6 py-3.5">
              <p className="text-[13px] tabular-nums text-admin-muted">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50">
          <div className="backdrop-in absolute inset-0 bg-[#3a2418]/20 backdrop-blur-[3px]" onClick={() => setSelectedCustomer(null)} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Manage ${selectedCustomer.email}`}
            className="dialog-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-admin-surface shadow-[0_0_60px_-10px_rgba(122,82,40,0.4)]"
          >
            <div className="admin-silk relative overflow-hidden border-b border-admin-gold/30 px-6 pb-6 pt-5">
              <div aria-hidden="true" className="admin-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close"
                className="relative ml-auto grid h-9 w-9 place-items-center rounded-lg text-admin-muted hover:bg-white/80 hover:text-admin-maroon"
              >
                <X size={18} />
              </button>
              <div className="relative mt-2 flex items-center gap-4">
                <Avatar name={fullName(selectedCustomer) || selectedCustomer.email} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold tracking-[-0.02em] text-admin-ink">{fullName(selectedCustomer) || 'Unnamed'}</p>
                  <p className="text-xs text-admin-gold-ink">Member since {formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <ul className="space-y-3 text-sm text-admin-body">
                <li className="flex items-center gap-3"><Mail size={16} className="text-admin-gold-ink" /> {selectedCustomer.email}</li>
                {selectedCustomer.phone && (
                  <li className="flex items-center gap-3"><Phone size={16} className="text-admin-gold-ink" /> {selectedCustomer.phone}</li>
                )}
                {selectedCustomer.addresses?.[0] && (
                  <li className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 text-admin-gold-ink" />
                    <span>
                      {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state}
                      {selectedCustomer.addresses.length > 1 && (
                        <span className="text-admin-muted"> · +{selectedCustomer.addresses.length - 1} more</span>
                      )}
                    </span>
                  </li>
                )}
              </ul>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-gold-ink">Access</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['customer', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors',
                        role === r
                          ? 'border-admin-gold/60 bg-admin-gold-soft text-admin-maroon shadow-[0_1px_3px_rgba(122,82,40,0.15)]'
                          : 'border-admin-line bg-admin-surface text-admin-body hover:border-admin-line-strong'
                      )}
                    >
                      {r === 'admin' ? <ShieldCheck size={16} className={role === r ? 'text-admin-maroon' : 'text-admin-muted'} /> : <Users size={16} className={role === r ? 'text-admin-maroon' : 'text-admin-muted'} />}
                      {r === 'admin' ? 'Admin' : 'Customer'}
                    </button>
                  ))}
                </div>
                <Toggle label="Account active" checked={isActive} onChange={setIsActive} />
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-admin-line bg-admin-subtle p-4">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedCustomer(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!dirty || updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
