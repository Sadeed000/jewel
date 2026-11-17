'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Upload, X, ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton, EmptyState } from '@/components/common/Loading';
import { useImageSearch, useBestsellers } from '@/hooks/useProducts';
import type { ImageSearchResult } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Server accepts 5 MB; we downscale before sending, so this only guards
   against someone picking a RAW-sized file we can't even decode. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1400;

const TYPE_LABELS: Record<string, string> = {
  rings: 'Rings',
  earrings: 'Earrings',
  pendants: 'Pendants',
  necklaces: 'Necklaces',
  chains: 'Chains',
  bracelets: 'Bracelets',
  mangalsutra: 'Mangalsutra',
  bangles: 'Bangles',
  'nose-pin': 'Nose Pins',
};

const CATEGORY_LABELS: Record<string, string> = {
  gold: 'Gold',
  diamond: 'Diamond',
  gemstone: 'Gemstone',
  platinum: 'Platinum',
  silver: 'Silver',
};

/**
 * Shrink and re-encode before upload. A modern phone photo is 4–8 MB, which
 * would be rejected outright and would waste a couple of seconds on the wire —
 * while keeping small originals intact for exact-photo recognition.
 * Also normalises HEIC/odd formats to JPEG via the canvas encoder.
 */
async function prepareImage(file: File): Promise<Blob> {
  // Preserve small originals for exact-photo recognition, and preserve PNG alpha.
  if (file.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas context');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    );
    if (!blob) throw new Error('encode failed');
    return blob;
  } catch {
    // Browser couldn't decode it (rare formats) — let the server have a go.
    return file;
  }
}

export default function ImageSearchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [prepared, setPrepared] = useState<Blob | null>(null);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [refine, setRefine] = useState<{ category?: string; type?: string }>({});

  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const searchSequence = useRef(0);
  const fileSequence = useRef(0);

  const search = useImageSearch();
  // Only fetched for the "nothing matched" fallback.
  const { data: bestsellers } = useBestsellers(8);

  /* Object URLs must be released or every re-pick leaks a blob. */
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const runSearch = useCallback(
    async (blob: Blob, filters: { category?: string; type?: string } = {}) => {
      const sequence = ++searchSequence.current;
      setLocalError(null);
      try {
        const data = await search.mutateAsync({ file: blob, ...filters });
        if (sequence === searchSequence.current) setResult(data);
      } catch {
        // Surfaced from search.error below — nothing extra to do here.
      }
    },
    [search]
  );

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      const sequence = ++fileSequence.current;
      searchSequence.current++;

      if (!file.type.startsWith('image/')) {
        setLocalError('That file isn’t an image. Please choose a JPG, PNG or WebP photo.');
        return;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setLocalError('That photo is very large. Please pick one under 25 MB.');
        return;
      }

      setLocalError(null);
      setResult(null);
      const filters = { type: refine.type };
      setRefine(filters);
      search.reset();

      const blob = await prepareImage(file);
      if (sequence !== fileSequence.current) return;
      setPrepared(blob);
      setFileName(file.name || 'Your photo');
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });

      await runSearch(blob, filters);
    },
    [runSearch, search, refine.type]
  );

  /* Paste a screenshot straight onto the page — how people actually share a
     piece they've seen on Instagram or WhatsApp. Routed through a ref so the
     listener is attached once rather than on every render. */
  const handleFileRef = useRef(handleFile);
  handleFileRef.current = handleFile;

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
      if (item) handleFileRef.current(item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const reset = () => {
    fileSequence.current++;
    searchSequence.current++;
    setResult(null);
    setPrepared(null);
    setFileName('');
    setRefine({});
    setLocalError(null);
    search.reset();
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (fileInput.current) fileInput.current.value = '';
    if (cameraInput.current) cameraInput.current.value = '';
  };

  const applyRefine = (next: { category?: string; type?: string }) => {
    if (!prepared) return;
    setRefine(next);
    runSearch(prepared, next);
  };

  const errorMessage = localError || (search.isError ? (search.error as Error).message : null);
  const items = result?.items ?? [];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Search With a Pic' }]} />

      <div className="container-custom pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl text-brand-ink">Search With a Pic</h1>
          <p className="text-sm text-brand-muted mt-2 max-w-xl mx-auto">
            Upload a photo of a piece you love and we&apos;ll rank our catalogue by how closely it
            matches — on metal tone, colour, shape and detailing.
          </p>
        </div>

        {/* Hidden inputs drive both the drop zone and the camera button. */}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Cleared so re-picking the same file still fires a change event.
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Cleared so re-picking the same file still fires a change event.
            e.target.value = '';
          }}
        />

        {!preview ? (
          /* ───────────── Upload ───────────── */
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="image-search-type" className="text-xs text-brand-muted">Narrow your search for a closer match</label>
              <select id="image-search-type" value={refine.type ?? ''} onChange={(e) => setRefine({ type: e.target.value || undefined })} className="rounded-lg border border-brand-cream-dark bg-white px-3 py-2 text-sm text-brand-ink">
                <option value="">Any jewellery type</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
                dragging
                  ? 'border-brand-maroon bg-white'
                  : 'border-brand-gold bg-brand-cream hover:bg-white'
              )}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-white grid place-items-center mb-4">
                <Camera size={32} className="text-brand-maroon" />
              </div>
              <p className="font-display text-2xl text-brand-ink">
                {dragging ? 'Drop your photo' : 'Upload an Image'}
              </p>
              <p className="text-sm text-brand-muted mt-2">
                Drag &amp; drop, paste from your clipboard, or browse · JPG, PNG, WebP
              </p>
              <span className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-brand-maroon text-white text-sm rounded-full">
                <Upload size={14} /> Choose File
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInput.current?.click();
                }}
                className="block mx-auto mt-4 text-xs text-brand-maroon hover:underline"
              >
                Or take a photo with your camera
              </button>
            </div>

            {errorMessage && (
              <p className="mt-4 text-sm text-red-600 text-center" role="alert">
                {errorMessage}
              </p>
            )}

            <p className="mt-4 text-center text-xs leading-relaxed text-brand-muted">For the closest match, crop to one piece and use a sharp, well-lit photo. We search designs available in our catalogue.</p>
            <div className="mt-8">
              <p className="text-xs text-brand-muted mb-3">What others are looking for</p>
              <div className="flex flex-wrap gap-2">
                {['Gemstone', 'Mangalsutra', 'Solitaire', 'Pendants', 'Bridal Sets', 'Bangles'].map(
                  (t) => (
                    <Link
                      key={t}
                      href={`/search?q=${encodeURIComponent(t)}`}
                      className="px-4 py-1.5 border border-brand-cream-dark rounded-full text-xs hover:border-brand-maroon hover:text-brand-maroon transition-colors"
                    >
                      ↗ {t}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ───────────── Results ───────────── */
          <div>
            <div className="bg-white border border-brand-cream-dark rounded-lg p-4 md:p-6 mb-8 flex flex-col sm:flex-row items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image can't optimise it */}
              <img
                src={preview}
                alt="Your uploaded photo"
                className="w-24 h-24 object-cover rounded-lg border border-brand-cream-dark"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-brand-ink truncate">{fileName}</p>

                {search.isPending ? (
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin" /> Analysing your photo and
                    comparing it with our catalogue…
                  </p>
                ) : errorMessage ? (
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                ) : result ? (
                  <>
                    <p className="text-xs text-brand-muted mt-1">
                      Compared against {result.indexed} piece{result.indexed === 1 ? '' : 's'} ·{' '}
                      {result.detected.toneLabel}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="flex items-center gap-1">
                        {result.detected.palette.slice(0, 5).map((c) => (
                          <span
                            key={c.hex}
                            title={`${c.hex} · ${Math.round(c.share * 100)}%`}
                            className="w-5 h-5 rounded-full border border-brand-cream-dark"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>

                      {result.detected.gemstone && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-brand-cream rounded-full text-brand-ink capitalize">
                          <Sparkles size={11} /> Looks like {result.detected.gemstone}
                        </span>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fileInput.current?.click()}
                  className="text-xs px-4 py-2 border border-brand-cream-dark rounded-full hover:border-brand-maroon hover:text-brand-maroon transition-colors"
                >
                  Change photo
                </button>
                <button
                  onClick={reset}
                  aria-label="Clear image search"
                  className="p-2 rounded-full hover:bg-brand-cream transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Refinements — the photo is re-scored server-side against the
                narrowed set, so the match percentages stay meaningful. */}
            {result && (result.suggested.category || result.suggested.types.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs text-brand-muted mr-1">Refine:</span>
                <button
                  onClick={() => applyRefine({})}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs border transition-colors',
                    !refine.category && !refine.type
                      ? 'bg-brand-maroon text-white border-brand-maroon'
                      : 'border-brand-cream-dark hover:border-brand-maroon'
                  )}
                >
                  All matches
                </button>

                {result.suggested.category && (
                  <button
                    onClick={() =>
                      applyRefine({
                        category:
                          refine.category === result.suggested.category
                            ? undefined
                            : result.suggested.category!,
                      })
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      refine.category
                        ? 'bg-brand-maroon text-white border-brand-maroon'
                        : 'border-brand-cream-dark hover:border-brand-maroon'
                    )}
                  >
                    {CATEGORY_LABELS[result.suggested.category] || result.suggested.category} only
                  </button>
                )}

                {result.suggested.types.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      applyRefine({
                        ...refine,
                        type: refine.type === t ? undefined : t,
                      })
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      refine.type === t
                        ? 'bg-brand-maroon text-white border-brand-maroon'
                        : 'border-brand-cream-dark hover:border-brand-maroon'
                    )}
                  >
                    {TYPE_LABELS[t] || t}
                  </button>
                ))}
              </div>
            )}

            {search.isPending ? (
              <ProductGridSkeleton count={8} />
            ) : errorMessage ? (
              <EmptyState
                icon="!"
                title="We couldn’t search that photo"
                description={errorMessage}
                action={
                  <button
                    onClick={() => prepared && runSearch(prepared, refine)}
                    className="btn-primary"
                  >
                    Try again
                  </button>
                }
              />
            ) : items.length === 0 ? (
              <>
                <EmptyState
                  icon="◎"
                  title="No close matches yet"
                  description="Nothing in the catalogue lines up with this photo. Try a clearer shot of a single piece against a plain background — or browse what's popular below."
                  action={
                    <button onClick={() => fileInput.current?.click()} className="btn-primary">
                      Upload another photo
                    </button>
                  }
                />
                {(bestsellers?.items?.length ?? 0) > 0 && (
                  <>
                    <h2 className="font-display text-2xl text-brand-ink mb-4">Popular Right Now</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {bestsellers!.items.map((p) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-display text-2xl text-brand-ink">Best Matches</h2>
                  <p className="text-xs text-brand-muted">
                    {items.length} piece{items.length === 1 ? '' : 's'}, closest first
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {items.map((p) => (
                    <div key={p._id} className="relative">
                      <span className="absolute z-10 top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-ink/85 text-white backdrop-blur-sm">
                        {p.matchKind === 'same-image' ? 'Same catalogue photo' : `${p.matchScore}/100 visual similarity`}
                      </span>
                      <ProductCard product={{ ...p, coverImages: p.matchedImage ? [p.matchedImage] : p.coverImages }} />
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-brand-muted mt-6 flex items-center gap-1.5">
                  <ImageIcon size={12} />
                  Matches are ranked by visual similarity — metal tone, colour, silhouette and
                  detailing. Your photo is analysed and discarded, never stored.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
