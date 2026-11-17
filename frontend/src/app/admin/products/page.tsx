'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit3, Trash2, Search, AlertCircle, PackageX } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '@/hooks/useAdmin';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import { SectionLoader, ErrorState } from '@/components/common/Loading';
import ImageUploader from '@/components/admin/ImageUploader';
import Modal from '@/components/admin/Modal';
import { Field, Input, Select, Textarea, Toggle, Button, SectionTitle } from '@/components/admin/FormControls';
import { ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';

const categoryOptions = ['gold', 'diamond', 'gemstone', 'platinum', 'silver'] as const;
const typeOptions = [
  'rings', 'earrings', 'pendants', 'necklaces', 'chains', 'bracelets', 'mangalsutra', 'bangles', 'nose-pin',
] as const;
const occasionOptions = ['wedding', 'daily-wear', 'festive', 'office', 'party', 'gifting'] as const;
const gemstoneOptions = ['none', 'emerald', 'ruby', 'sapphire', 'tanzanite', 'pearl', 'coral'] as const;
const genderOptions = ['women', 'men', 'kids', 'unisex'] as const;
const labOptions = ['IGI', 'GIA', 'GII', 'SGL', 'IIGJ', 'other'] as const;
const treatmentOptions = ['none', 'heated', 'oiled', 'diffused', 'irradiated', 'undisclosed'] as const;

/**
 * The standard size scale per product type, mirroring lib/tryOn.ts. Shown as
 * placeholder text so an admin can see what a product falls back to when the
 * Sizes field is left blank, rather than guessing.
 */
const DEFAULT_SIZES: Partial<Record<Product['type'], string>> = {
  rings: '14, 15, 16, 17, 18, 19, 20, 21',
  bangles: '2.2, 2.4, 2.6, 2.8',
  bracelets: '6.5, 7, 7.5, 8',
  chains: '16, 18, 20, 22, 24',
  necklaces: '16, 18, 20',
  mangalsutra: '18, 20, 24',
};

type ProductForm = Partial<Product>;

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  sku: '',
  category: 'gold',
  type: 'rings',
  sizes: [],
  price: 0,
  originalPrice: 0,
  coverImages: [],
  detailedImages: [],
  videos: [],
  metal: '',
  purity: '',
  weight: '',
  description: '',
  inStock: true,
  stockQty: 0,
  isBestseller: false,
  isNew: false,
  isExpertChoice: false,
  onlyOneLeft: false,
  hidden: false,
  collection: '',
  occasion: 'wedding',
  gemstone: 'none',
  gender: 'women',
  bisHallmark: true,
  freeResize: true,
  engravingAvailable: false,
  engravingMaxChars: 20,
  gemstoneDetails: {},
  certification: {},
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

/** "16, 17 , 18" → ['16','17','18'] */
const parseSizes = (raw: string) =>
  raw.split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Strip blanks out of an optional nested group. Joi rejects '' on the numeric
 * keys (caratWeight, stoneCount), and a group of empty strings is noise in the
 * document — so an all-blank group is dropped from the payload entirely.
 */
const pruneGroup = (group: Record<string, unknown> | undefined) => {
  const cleaned = Object.entries(group ?? {}).filter(
    ([, v]) => v !== '' && v !== null && v !== undefined && !(typeof v === 'number' && Number.isNaN(v))
  );
  return cleaned.length ? Object.fromEntries(cleaned) : undefined;
};

export default function AdminProductsPage() {
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  // Sizes are edited as free text so a half-typed "16, " isn't destroyed by
  // splitting and rejoining on every keystroke. Parsed on save.
  const [sizesText, setSizesText] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useProducts({ limit: 100 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const isSaving = createProduct.isPending || updateProduct.isPending;

  const set = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  type GemDetails = NonNullable<Product['gemstoneDetails']>;
  const setGem = <K extends keyof GemDetails>(field: K, value: GemDetails[K]) =>
    setForm((prev) => ({ ...prev, gemstoneDetails: { ...prev.gemstoneDetails, [field]: value } }));

  type Cert = NonNullable<Product['certification']>;
  const setCert = <K extends keyof Cert>(field: K, value: Cert[K]) =>
    setForm((prev) => ({ ...prev, certification: { ...prev.certification, [field]: value } }));

  /** Blank number inputs must clear the key, not send NaN. */
  const numOrUndefined = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSizesText('');
    setSaveError(null);
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      ...product,
      coverImages: product.coverImages ?? [],
      detailedImages: product.detailedImages ?? [],
      videos: product.videos ?? [],
      sizes: product.sizes ?? [],
      gemstoneDetails: product.gemstoneDetails ?? {},
      certification: product.certification ?? {},
    });
    setSizesText((product.sizes ?? []).join(', '));
    setSaveError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaveError(null);

    const coverImages = form.coverImages ?? [];
    const detailedImages = form.detailedImages ?? [];

    if (coverImages.length === 0) {
      setSaveError('Upload at least one cover image.');
      return;
    }

    const payload: ProductForm = {
      ...form,
      slug: form.slug?.trim() || slugify(form.name ?? ''),
      coverImages,
      detailedImages,
      // `images` is the legacy field the storefront reads; keep it in sync.
      images: [...coverImages, ...detailedImages],
      // Empty means "fall back to the standard scale for this type".
      sizes: parseSizes(sizesText),
    };

    // Joi rejects empty strings on optional fields, so drop the blanks.
    (['sku', 'collection', 'originalPrice'] as const).forEach((k) => {
      if (payload[k] === '' || payload[k] === 0) delete payload[k];
    });

    const raw = payload as Record<string, unknown>;
    // Optional nested groups: send them only when they carry something.
    for (const group of ['gemstoneDetails', 'certification'] as const) {
      const cleaned = pruneGroup(raw[group] as Record<string, unknown>);
      if (cleaned) raw[group] = cleaned;
      else delete raw[group];
    }
    if (payload.engravingMaxChars == null || Number.isNaN(payload.engravingMaxChars)) {
      delete raw.engravingMaxChars;
    }

    delete raw._id;
    delete raw.discountPercent;
    delete raw.rating;
    delete raw.reviewCount;

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing._id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setOpen(false);
      setForm(emptyForm);
      setSizesText('');
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

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) return;
    await deleteProduct.mutateAsync(product._id);
    refetch();
  };

  if (isLoading) return <SectionLoader label="Loading products…" />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-brand-ink">Products</h2>
          <p className="text-sm text-brand-muted">
            {products.length} product{products.length === 1 ? '' : 's'} in the catalogue
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add product
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU or category"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <PackageX size={32} className="text-slate-300" />
            <p className="text-sm text-brand-muted">
              {products.length === 0 ? 'No products yet. Add your first one.' : 'No products match that search.'}
            </p>
            {products.length === 0 && (
              <Button onClick={openCreate}>
                <Plus size={16} /> Add product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => {
                  const thumb = product.coverImages?.[0] ?? product.images?.[0];
                  return (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {thumb && (
                              <Image
                                src={resolveImageUrl(thumb)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="44px"
                                unoptimized
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-brand-ink">{product.name}</p>
                            <p className="text-xs text-brand-muted">{product.sku || product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-cream px-2.5 py-1 text-xs capitalize text-brand-maroon">
                          {product.category}
                        </span>
                        <span className="ml-1.5 text-xs capitalize text-brand-muted">{product.type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        {product.inStock ? (
                          <span className="text-xs text-emerald-700">In stock ({product.stockQty ?? 0})</span>
                        ) : (
                          <span className="text-xs text-red-600">Out of stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            className="rounded-lg p-2 text-brand-muted hover:bg-brand-cream hover:text-brand-maroon"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            aria-label={`Delete ${product.name}`}
                            className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
        subtitle={editing ? editing.name : 'Fields marked * are required'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
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
            <SectionTitle>Basics</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={form.name ?? ''}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Eternal Solitaire Ring"
                />
              </Field>
              <Field label="Slug" hint="Auto-generated from the name if left blank">
                <Input
                  value={form.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder={slugify(form.name ?? '') || 'eternal-solitaire-ring'}
                />
              </Field>
              <Field label="SKU">
                <Input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} placeholder="AUR-RG-001" />
              </Field>
              <Field label="Collection">
                <Input
                  value={form.collection ?? ''}
                  onChange={(e) => set('collection', e.target.value)}
                  placeholder="Bridal"
                />
              </Field>
              <Field label="Category" required>
                <Select
                  options={categoryOptions}
                  value={form.category ?? 'gold'}
                  onChange={(e) => set('category', e.target.value as Product['category'])}
                />
              </Field>
              <Field label="Type" required>
                <Select
                  options={typeOptions}
                  value={form.type ?? 'rings'}
                  onChange={(e) => set('type', e.target.value as Product['type'])}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Pricing &amp; stock</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (₹)" required>
                <Input
                  type="number"
                  min={0}
                  value={form.price ?? 0}
                  onChange={(e) => set('price', Number(e.target.value))}
                />
              </Field>
              <Field label="Original price (₹)" hint="Shown struck through">
                <Input
                  type="number"
                  min={0}
                  value={form.originalPrice ?? 0}
                  onChange={(e) => set('originalPrice', Number(e.target.value))}
                />
              </Field>
              <Field label="Stock quantity">
                <Input
                  type="number"
                  min={0}
                  value={form.stockQty ?? 0}
                  onChange={(e) => set('stockQty', Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle label="In stock" checked={!!form.inStock} onChange={(v) => set('inStock', v)} />
              <Toggle label="Bestseller" checked={!!form.isBestseller} onChange={(v) => set('isBestseller', v)} />
              <Toggle label="New arrival" checked={!!form.isNew} onChange={(v) => set('isNew', v)} />
              <Toggle label="Only one left" checked={!!form.onlyOneLeft} onChange={(v) => set('onlyOneLeft', v)} />
              <Toggle
                label="Expert choice"
                checked={!!form.isExpertChoice}
                onChange={(v) => set('isExpertChoice', v)}
              />
              {/* Hidden pieces stay purchasable by direct link but are kept out
                  of listings and search — used for configurator base products. */}
              <Toggle label="Hidden from listings" checked={!!form.hidden} onChange={(v) => set('hidden', v)} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Images</SectionTitle>
            <ImageUploader
              label="Cover images *"
              description="Shown on listing cards and the product gallery. The first is the primary image."
              value={form.coverImages ?? []}
              onChange={(urls) => set('coverImages', urls)}
              maxImages={5}
              showPrimaryBadge
            />
            <ImageUploader
              label="Detailed images"
              description="Close-ups and lifestyle shots shown further down the product page."
              value={form.detailedImages ?? []}
              onChange={(urls) => set('detailedImages', urls)}
              maxImages={8}
            />
            <ImageUploader
              label="Product videos"
              description="Upload up to 3 product videos. Files are stored securely on Cloudinary and shown on the product page."
              value={form.videos ?? []}
              onChange={(urls) => set('videos', urls)}
              mediaType="video"
              maxImages={3}
            />
            {/* Try-on overlays the piece onto a live camera feed, so it needs
                the product cut out of its background. Without this it falls
                back to background extraction for plain studio photos. */}
            <ImageUploader
              label="Virtual try-on cut-out"
              description="Use a sharp, front-facing transparent PNG, cropped closely to the jewellery. For earrings, upload ONE earring, upright with its attachment at the top. Avoid models, display stands and shadows."
              value={form.tryOnImage ? [form.tryOnImage] : []}
              onChange={(urls) => set('tryOnImage', urls[0] ?? '')}
              maxImages={1}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tryOnEnabled !== false}
                onChange={(e) => set('tryOnEnabled', e.target.checked)}
                className="accent-slate-900"
              />
              Offer virtual try-on for this product
            </label>
          </section>

          <section className="space-y-4">
            <SectionTitle>Specification</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Metal" required>
                <Input value={form.metal ?? ''} onChange={(e) => set('metal', e.target.value)} placeholder="18K Gold" />
              </Field>
              <Field label="Purity" required>
                <Input value={form.purity ?? ''} onChange={(e) => set('purity', e.target.value)} placeholder="18K / 750" />
              </Field>
              <Field label="Weight" required>
                <Input value={form.weight ?? ''} onChange={(e) => set('weight', e.target.value)} placeholder="3.2 g" />
              </Field>
              <Field label="Occasion">
                <Select
                  options={occasionOptions}
                  value={form.occasion ?? 'wedding'}
                  onChange={(e) => set('occasion', e.target.value as Product['occasion'])}
                />
              </Field>
              <Field label="Gemstone">
                <Select
                  options={gemstoneOptions}
                  value={form.gemstone ?? 'none'}
                  onChange={(e) => set('gemstone', e.target.value as Product['gemstone'])}
                />
              </Field>
              <Field label="Gender">
                <Select
                  options={genderOptions}
                  value={form.gender ?? 'women'}
                  onChange={(e) => set('gender', e.target.value as Product['gender'])}
                />
              </Field>
            </div>
            <Field
              label="Sizes"
              hint={
                DEFAULT_SIZES[form.type as Product['type']]
                  ? `Comma-separated. Leave blank to offer the standard ${(form.type ?? '').replace(/-/g, ' ')} scale: ${DEFAULT_SIZES[form.type as Product['type']]}`
                  : 'Comma-separated. Leave blank if this piece is not sized — no size selector is shown and no size is attached to the order.'
              }
            >
              <Input
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder={DEFAULT_SIZES[form.type as Product['type']] ?? '16, 18, 20'}
              />
            </Field>
            <Field label="Description" required>
              <Textarea
                rows={4}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the craftsmanship, stones and finish…"
              />
            </Field>
          </section>

          <section className="space-y-4">
            <SectionTitle>Certification &amp; hallmark</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Lab" hint="Leave unset if the piece is uncertified">
                <Select
                  options={labOptions}
                  placeholder="— none —"
                  value={form.certification?.lab ?? ''}
                  onChange={(e) => setCert('lab', (e.target.value || undefined) as Cert['lab'])}
                />
              </Field>
              <Field label="Certificate number" hint="What a buyer types into the lab's site">
                <Input
                  value={form.certification?.certificateNumber ?? ''}
                  onChange={(e) => setCert('certificateNumber', e.target.value)}
                  placeholder="IGI-123456789"
                />
              </Field>
              <Field label="Verification URL">
                <Input
                  value={form.certification?.verifyUrl ?? ''}
                  onChange={(e) => setCert('verifyUrl', e.target.value)}
                  placeholder="https://www.igi.org/verify"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle
                label="BIS hallmarked"
                checked={form.bisHallmark !== false}
                onChange={(v) => set('bisHallmark', v)}
              />
              <Toggle
                label="Free resizing"
                checked={form.freeResize !== false}
                onChange={(v) => set('freeResize', v)}
              />
              <Toggle
                label="Engraving available"
                checked={!!form.engravingAvailable}
                onChange={(v) => set('engravingAvailable', v)}
              />
            </div>
            {form.engravingAvailable && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Max engraving characters">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.engravingMaxChars ?? 20}
                    onChange={(e) => set('engravingMaxChars', numOrUndefined(e.target.value))}
                  />
                </Field>
              </div>
            )}
          </section>

          {/* Origin and treatment move a coloured stone's price more than the
              design does, so they only make sense on stone-set pieces. */}
          {form.gemstone && form.gemstone !== 'none' && (
            <section className="space-y-4">
              <SectionTitle>Gemstone provenance</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Carat weight" hint="Stone weight, not the piece's gross weight">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.gemstoneDetails?.caratWeight ?? ''}
                    onChange={(e) => setGem('caratWeight', numOrUndefined(e.target.value))}
                    placeholder="1.25"
                  />
                </Field>
                <Field label="Origin">
                  <Input
                    value={form.gemstoneDetails?.origin ?? ''}
                    onChange={(e) => setGem('origin', e.target.value)}
                    placeholder="Zambian"
                  />
                </Field>
                <Field label="Treatment">
                  <Select
                    options={treatmentOptions}
                    placeholder="— not stated —"
                    value={form.gemstoneDetails?.treatment ?? ''}
                    onChange={(e) =>
                      setGem('treatment', (e.target.value || undefined) as GemDetails['treatment'])
                    }
                  />
                </Field>
                <Field label="Clarity">
                  <Input
                    value={form.gemstoneDetails?.clarity ?? ''}
                    onChange={(e) => setGem('clarity', e.target.value)}
                    placeholder="VS1"
                  />
                </Field>
                <Field label="Cut">
                  <Input
                    value={form.gemstoneDetails?.cut ?? ''}
                    onChange={(e) => setGem('cut', e.target.value)}
                    placeholder="Emerald cut"
                  />
                </Field>
                <Field label="Stone count">
                  <Input
                    type="number"
                    min={1}
                    value={form.gemstoneDetails?.stoneCount ?? ''}
                    onChange={(e) => setGem('stoneCount', numOrUndefined(e.target.value))}
                    placeholder="1"
                  />
                </Field>
              </div>
            </section>
          )}
        </div>
      </Modal>
    </div>
  );
}
