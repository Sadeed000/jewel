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
import { PageHeader, Chip, AdminEmpty, AdminSkeleton, AdminError } from '@/components/admin/ui';
import ImageUploader from '@/components/admin/ImageUploader';
import Modal from '@/components/admin/Modal';
import { Field, Input, Textarea, Toggle, Button, SectionTitle } from '@/components/admin/FormControls';
import { ApiError } from '@/lib/api';
import type { Category } from '@/lib/types';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';

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
  const confirm = useConfirm();
  const toast = useToast();

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
    const ok = await confirm({
      title: `Delete "${category.name}"?`,
      description:
        'This category will be permanently removed from the storefront navigation and menus. This cannot be undone.',
      confirmLabel: 'Delete category',
    });
    if (!ok) return;
    try {
      await deleteCategory.mutateAsync(category._id);
      toast.success('Category deleted', { description: category.name });
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Could not delete this category.');
    }
  };

  if (isLoading) return <AdminSkeleton rows={4} />;
  if (error) return <AdminError title="Couldn't load categories" message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} · shown in navigation and mega menu`}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card">
          <AdminEmpty
            icon={FolderOpen}
            title="No categories yet"
            description="Categories organise the storefront navigation and mega menu."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} /> Add category
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group overflow-hidden rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card transition-[box-shadow,transform,border-color] duration-base ease-premium hover:-translate-y-0.5 hover:border-admin-line-strong hover:shadow-admin-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-admin-subtle">
                {category.image && (
                  <Image
                    src={resolveImageUrl(category.image)}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-slow ease-premium group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#5a1a1a]/15 via-transparent to-transparent" aria-hidden="true" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-admin-ink backdrop-blur">
                  #{category.sortOrder ?? 0}
                </span>
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <button
                    onClick={() => openEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-admin-ink shadow-sm backdrop-blur hover:bg-white"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-rose-600 shadow-sm backdrop-blur hover:bg-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-admin-gold">{category.icon}</span>}
                  <p className="truncate font-semibold text-admin-ink">{category.name}</p>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-admin-muted">/{category.slug}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {category.showInNav && <Chip tone="gold">Navigation</Chip>}
                  {category.showInMegaMenu && <Chip tone="gold">Mega menu</Chip>}
                  {!category.showInNav && !category.showInMegaMenu && <Chip>Hidden</Chip>}
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
