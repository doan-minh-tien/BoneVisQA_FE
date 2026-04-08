'use client';

import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/api/upload';
import { resolveApiAssetUrl } from '@/lib/api/client';

const SIZES = {
  sm: { circle: 'h-16 w-16 text-2xl', badge: 'h-7 w-7', icon: 'h-3.5 w-3.5', spin: 'h-6 w-6' },
  lg: { circle: 'h-24 w-24 text-3xl', badge: 'h-9 w-9', icon: 'h-4 w-4', spin: 'h-8 w-8' },
  xl: { circle: 'h-40 w-40 text-4xl', badge: 'h-10 w-10', icon: 'h-5 w-5', spin: 'h-10 w-10' },
} as const;

type Size = keyof typeof SIZES;

type ProfileAvatarPickerProps = {
  /** Stored value: full URL (OAuth) or relative path e.g. `/uploads/images/...` */
  avatarUrl: string;
  initials: string;
  alt: string;
  onUrlChange: (url: string) => void;
  onError?: (message: string) => void;
  /** `sm` = settings cards; `lg` = student profile header; `xl` = profile hero */
  size?: Size;
  /** Large avatar with ring, hover overlay, optional footer (hides default hint). */
  variant?: 'default' | 'hero';
  /** Replaces the default “Bấm ảnh…” caption when provided. */
  footer?: (openPicker: () => void) => ReactNode;
};

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';

export function ProfileAvatarPicker({
  avatarUrl,
  initials,
  alt,
  onUrlChange,
  onError,
  size = 'sm',
  variant = 'default',
  footer,
}: ProfileAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dim = SIZES[size];
  const resolved = resolveApiAssetUrl(avatarUrl.trim());

  const pickFile = () => inputRef.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Please choose an image file (JPG, PNG, GIF, WebP, or SVG).');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError?.('Image must be 10MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUrlChange(url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const heroRing =
    variant === 'hero'
      ? 'ring-4 ring-[#a9c7ff] shadow-lg border-0 bg-muted/20'
      : 'border border-border bg-muted/30';

  return (
    <div className="relative inline-flex shrink-0 flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onFile}
      />
      <div className={variant === 'hero' ? 'group relative cursor-pointer' : undefined}>
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          aria-label="Change profile photo"
          title="Change profile photo"
          className={`relative rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[#005eb8] disabled:opacity-60 ${heroRing} ${dim.circle} ${
            variant === 'hero' ? 'group-hover:opacity-75' : ''
          }`}
        >
          {uploading ? (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
              <Loader2 className={`animate-spin text-[#00478d] ${dim.spin}`} />
            </span>
          ) : resolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolved} alt={alt} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#00478d]/10 font-bold text-[#00478d]">
              {initials || '?'}
            </span>
          )}
          {variant === 'default' ? (
            <span
              className={`pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ${dim.badge}`}
              aria-hidden
            >
              <Camera className={dim.icon} />
            </span>
          ) : null}
          {variant === 'hero' && !uploading ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-9 w-9 text-white" aria-hidden />
            </span>
          ) : null}
        </button>
      </div>
      {footer ? (
        footer(pickFile)
      ) : (
        <p className="max-w-[10rem] text-center text-[10px] leading-tight text-muted-foreground sm:max-w-none">
          Bấm ảnh để tải lên
        </p>
      )}
    </div>
  );
}
