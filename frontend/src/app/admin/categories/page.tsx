'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit3, Trash2, AlertCircle, FolderOpen } from 'lucide-react';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useAdmin';
import { resolveImageUrl } from '@/lib/utils';
import { SectionLoader, ErrorState } from '@/components/common/Loading';
import ImageUploader from '@/components/admin/ImageUploader';
import Modal from '@/components/admin/Modal';
import { Field, Input, Textarea, Toggle, Button, SectionTitle } from '@/components/admin/FormControls';
import { ApiError } from '@/lib/api';
import type { Category } from '@/lib/types';

type CategoryForm = Partial<Category>;

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  icon: '',
  image: '',
  description: '',
  href: '',
  sortOrder: 0,
  showInNav: true,
  showInMegaMenu: true,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export default function AdminCategoriesPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = useMemo(() => data ?? [], [data]);
  const isSaving = createCategory.isPending || updateCategory.isPending;

  const set = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSaveError(null);
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({ ...category });
    setSaveError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaveError(null);

    if (!form.image) {
      setSaveError('Upload a tile image for this category.');
      return;
    }

    const payload: CategoryForm = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name ?? ''),
    };

    // Joi rejects unknown keys and empty optional strings.
    (['icon', 'description', 'href'] as const).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    delete (payload as Record<string, unknown>)._id;
    delete (payload as Record<string, unknown>).subCategories;

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing._id, payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      refetch();
    } catch (err) {
      const detail =
        err instanceof ApiError && err.details?.length
          ? err.details.map((d) => `${d.field}: ${d.message}`).join(' · ')
          : (err as Error).message;
      setSaveError(detail);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name}" permanently?`)) return;
    await deleteCategory.mutateAsync(category._id);
    refetch();
  };

  if (isLoading) return <SectionLoader label="Loading categories…" />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-brand-ink">Categories</h2>
          <p className="text-sm text-brand-muted">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · shown in navigation and mega menu
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add category
        </Button>
      </header>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <FolderOpen size={32} className="text-slate-300" />
          <p className="text-sm text-brand-muted">No categories yet. Add your first one.</p>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                {category.image && (
                  <Image
                    src={resolveImageUrl(category.image)}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized
                  />
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="rounded-lg bg-white/90 p-2 text-brand-maroon hover:bg-white"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-brand-gold-dark">{category.icon}</span>}
                  <p className="font-medium text-brand-ink">{category.name}</p>
                </div>
                <p className="mt-0.5 text-xs text-brand-muted">/{category.slug}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.showInNav && (
                    <span className="rounded-full bg-brand-cream px-2 py-0.5 text-[10px] text-brand-maroon">Nav</span>
                  )}
                  {category.showInMegaMenu && (
                    <span className="rounded-full bg-brand-cream px-2 py-0.5 text-[10px] text-brand-maroon">
                      Mega menu
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-brand-muted">
                    #{category.sortOrder ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
        subtitle={editing ? editing.name : 'Fields marked * are required'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {saveError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}

          <section className="space-y-4">
            <SectionTitle>Details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Earrings" />
              </Field>
              <Field label="Slug" hint="Auto-generated from the name if left blank">
                <Input
                  value={form.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder={slugify(form.name ?? '') || 'earrings'}
                />
              </Field>
              <Field label="Icon" hint="A single emoji or symbol used in the nav">
                <Input
                  value={form.icon ?? ''}
                  onChange={(e) => set('icon', e.target.value)}
                  placeholder="◐"
                  maxLength={10}
                />
              </Field>
              <Field label="Link override" hint="Defaults to /shop/<slug>">
                <Input value={form.href ?? ''} onChange={(e) => set('href', e.target.value)} placeholder="/earrings" />
              </Field>
              <Field label="Sort order" hint="Lower numbers appear first">
                <Input
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => set('sortOrder', Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Short blurb shown on the category tile…"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Show in navigation" checked={!!form.showInNav} onChange={(v) => set('showInNav', v)} />
              <Toggle
                label="Show in mega menu"
                checked={!!form.showInMegaMenu}
                onChange={(v) => set('showInMegaMenu', v)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Tile image</SectionTitle>
            <ImageUploader
              label="Category image *"
              description="Used on the category tile and mega menu."
              value={form.image ? [form.image] : []}
              onChange={(urls) => set('image', urls[0] ?? '')}
              maxImages={1}
            />
          </section>
        </div>
      </Modal>
    </div>
  );
}
