'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Star, Loader2, AlertCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn, resolveImageUrl } from '@/lib/utils';
import { useConfirm } from '@/components/providers/ConfirmProvider';

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label: string;
  description?: string;
  maxImages?: number;
  accept?: string;
  mediaType?: 'image' | 'video';
  /** Marks the first image as the primary one shown to shoppers. */
  showPrimaryBadge?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ImageUploader({
  value,
  onChange,
  label,
  description,
  maxImages = 5,
  mediaType = 'image',
  accept = mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*',
  showPrimaryBadge = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const remaining = maxImages - value.length;
  const canAddMore = remaining > 0;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);

      if (files.length > remaining) {
        setError(`Only ${remaining} slot${remaining === 1 ? '' : 's'} left — extra files were ignored.`);
        files = files.slice(0, remaining);
      }

      const valid = files.filter((file) => {
        if (!file.type.startsWith(`${mediaType}/`)) {
          setError(`"${file.name}" is not a supported ${mediaType} file.`);
          return false;
        }
        if (file.size > (mediaType === 'video' ? 50 * 1024 * 1024 : MAX_FILE_BYTES)) {
          setError(`"${file.name}" is larger than ${mediaType === 'video' ? '50' : '5'}MB.`);
          return false;
        }
        return true;
      });

      if (valid.length === 0) return;

      setUploading(true);
      try {
        // One request for the whole batch — the endpoint accepts up to 10.
        const formData = new FormData();
        valid.forEach((file) => formData.append('files', file));

        const data = await api.upload<{ uploaded: UploadedFile[] }>(mediaType === 'video' ? '/uploads/videos' : '/uploads', formData);
        const urls = data.uploaded.map((f) => f.url);
        if (urls.length > 0) onChange([...value, ...urls]);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.status === 401
              ? 'Your session expired. Sign in again to upload.'
              : err.message
            : 'Upload failed. Check that the API is running.';
        setError(message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [value, onChange, remaining, mediaType]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!canAddMore || uploading) return;
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const removeAt = async (index: number) => {
    const ok = await confirm({
      title: mediaType === 'video' ? 'Remove this video?' : 'Remove this image?',
      description: `It will be removed from "${label}" when you save. You can upload it again later.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[13px] font-semibold text-admin-ink">{label}</label>
        <span className="rounded-full bg-admin-subtle px-2 py-0.5 text-[11px] font-medium tabular-nums text-admin-muted ring-1 ring-admin-line">
          {value.length} / {maxImages}
        </span>
      </div>
      {description && <p className="-mt-1 text-xs leading-relaxed text-admin-muted">{description}</p>}

      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-2xl border-[1.5px] border-dashed p-7 text-center transition-colors outline-none',
            'focus-visible:ring-4 focus-visible:ring-admin-gold/20',
            dragging
              ? 'border-admin-gold bg-admin-gold-soft'
              : 'border-admin-line-strong bg-admin-subtle hover:border-admin-gold hover:bg-admin-gold-soft/50',
            uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxImages > 1}
            accept={accept}
            onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
            disabled={uploading}
            className="hidden"
          />

          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-admin-surface text-admin-gold-ink shadow-admin-card ring-1 ring-admin-line">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
          </div>
          <p className="text-sm font-semibold text-admin-ink">
            {uploading ? 'Uploading…' : `Click to upload or drag ${mediaType === 'video' ? 'videos' : 'images'} here`}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            {mediaType === 'video' ? 'MP4, WebM or MOV · up to 50MB' : 'PNG, JPG, WebP, GIF or AVIF · up to 5MB'} · {remaining} slot{remaining === 1 ? '' : 's'} left
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-admin-line bg-admin-subtle shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                {mediaType === 'video' ? <video src={resolveImageUrl(url)} controls playsInline preload="metadata" className="h-full w-full object-contain" /> : <Image
                  src={resolveImageUrl(url)}
                  alt={`${label} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />}

                {showPrimaryBadge && index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-gradient-to-b from-admin-gold-light to-admin-gold px-2 py-0.5 text-[10px] font-semibold text-admin-ink shadow-sm">
                    Primary
                  </span>
                )}

                <div className={cn('absolute flex items-center justify-center gap-2 transition-opacity', mediaType === 'video' ? 'right-2 top-2' : 'inset-0 bg-[#fbf3e3]/75 opacity-0 backdrop-blur-[1px] group-hover:opacity-100 group-focus-within:opacity-100')}>
                  {showPrimaryBadge && index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(index)}
                      title="Make primary"
                      className="rounded-full bg-white/90 p-2 text-brand-maroon hover:bg-white"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    title="Remove"
                    className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !canAddMore && <p className="text-sm text-brand-muted">No images yet.</p>
      )}
    </div>
  );
}
