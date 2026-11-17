'use client';

import { useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAddAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import type { Address } from '@/lib/types';

const empty = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

type Form = typeof empty;

/** Mirrors backend/validators/userValidator.js. */
const validate = (a: Form): Partial<Record<keyof Form, string>> => {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!a.firstName.trim()) e.firstName = 'First name is required';
  if (!/^[+\d\s-]{7,20}$/.test(a.phone.trim())) e.phone = 'Enter a valid phone number';
  if (a.line1.trim().length < 3) e.line1 = 'Address is required';
  if (a.city.trim().length < 2) e.city = 'City is required';
  if (a.state.trim().length < 2) e.state = 'State is required';
  if (!/^\d{6}$/.test(a.pincode.trim())) e.pincode = 'Enter a 6-digit pincode';
  return e;
};

export default function AddressBook() {
  const toast = useToast();
  const { data: user } = useCurrentUser();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [serverError, setServerError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const addresses: Address[] = user?.addresses || [];

  const openNew = () => {
    setForm({ ...empty, isDefault: addresses.length === 0 });
    setEditing(null);
    setErrors({});
    setServerError('');
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setForm({
      label: a.label || 'Home',
      firstName: a.firstName,
      lastName: a.lastName || '',
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country || 'India',
      isDefault: a.isDefault,
    });
    setEditing(a._id);
    setErrors({});
    setServerError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setServerError('');
    try {
      if (editing) {
        await updateAddress.mutateAsync({ id: editing, payload: form as never });
      } else {
        await addAddress.mutateAsync(form as never);
      }
      setShowForm(false);
      setEditing(null);
      toast.success(editing ? 'Address updated' : 'Address added');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this address.';
      setServerError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    setServerError('');
    try {
      await deleteAddress.mutateAsync(id);
      toast.info('Address removed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this address.';
      setServerError(message);
      toast.error(message);
    }
  };

  const field = (key: keyof Form, placeholder: string, className = '') => (
    <div className={className}>
      <input
        value={String(form[key] ?? '')}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((p) => ({ ...p, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 border rounded outline-none focus:border-brand-gold text-sm',
          errors[key] ? 'border-brand-maroon' : 'border-brand-cream-dark'
        )}
      />
      {errors[key] && <p className="text-xs text-brand-maroon mt-1">{errors[key]}</p>}
    </div>
  );

  const saving = addAddress.isPending || updateAddress.isPending;

  return (
    <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-brand-ink">Address Book</h2>
        {!showForm && (
          <button onClick={openNew} className="btn-outline text-sm py-2 inline-flex items-center gap-2">
            <Plus size={14} /> Add Address
          </button>
        )}
      </div>

      {serverError && <p className="text-sm text-brand-maroon mb-4">{serverError}</p>}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-full bg-brand-cream grid place-items-center mb-4 text-3xl">📍</div>
          <p className="font-display text-xl text-brand-ink">No saved addresses</p>
          <p className="text-sm text-brand-muted mt-1">Add one to speed up checkout.</p>
          <button onClick={openNew} className="btn-primary mt-6">Add Address</button>
        </div>
      )}

      {addresses.length > 0 && (
        <div className="space-y-3 mb-6">
          {addresses.map((a) => (
            <div key={a._id} className="border border-brand-cream-dark rounded-lg p-4 flex items-start gap-3">
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {a.firstName} {a.lastName}
                  {a.label && <span className="text-xs text-brand-muted ml-2">{a.label}</span>}
                  {a.isDefault && (
                    <span className="text-[10px] uppercase tracking-wider bg-brand-cream text-brand-maroon px-2 py-0.5 rounded ml-2">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-brand-muted mt-1">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}
                </p>
                <p className="text-xs text-brand-muted">{a.phone}</p>
              </div>
              <button
                onClick={() => openEdit(a)}
                className="p-2 text-brand-muted hover:text-brand-ink"
                aria-label="Edit address"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(a._id)}
                disabled={deleteAddress.isPending}
                className="p-2 text-brand-muted hover:text-brand-maroon disabled:opacity-40"
                aria-label="Delete address"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="border-t border-brand-cream-dark pt-6">
          <h3 className="text-sm font-medium mb-4">{editing ? 'Edit address' : 'New address'}</h3>
          <div className="grid grid-cols-2 gap-4">
            {field('firstName', 'First Name')}
            {field('lastName', 'Last Name')}
            {field('phone', 'Phone Number', 'col-span-2')}
            {field('line1', 'House / Flat', 'col-span-2')}
            {field('line2', 'Street / Locality (optional)', 'col-span-2')}
            {field('city', 'City')}
            {field('state', 'State')}
            {field('pincode', 'Pincode')}
            {field('label', 'Label (Home, Work)')}
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm text-brand-muted cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="accent-brand-maroon"
            />
            Make this my default address
          </label>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
