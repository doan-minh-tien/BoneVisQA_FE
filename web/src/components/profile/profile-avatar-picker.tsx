'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/api/upload';
import { resolveApiAssetUrl } from '@/lib/api/client';

const SIZES = {
  sm: { circle: 'h-16 w-16 text-2xl', badge: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  lg: { circle: 'h-24 w-24 text-3xl', badge: 'h-9 w-9', icon: 'h-4 w-4' },
} as const;

type Size = keyof typeof SIZES;

type ProfileAvatarPickerProps = {
  /** Stored value: full URL (OAuth) or relative path e.g. `/uploads/images/...` */
  avatarUrl: string;
  initials: string;
  alt: string;
  onUrlChange: (url: string) => void;
  onError?: (message: string) => void;
  /** `sm` = settings cards; `lg` = student profile header */
  size?: Size;
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
}: ProfileAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dim = SIZES[size];
  const resolved = resolveApiAssetUrl(avatarUrl.trim());

  const pickFile = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        aria-label="Change profile photo"
        title="Change profile photo"
        className={`relative rounded-full border border-border bg-muted/30 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${dim.circle}`}
      >
        {uploading ? (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            <Loader2 className={`animate-spin text-primary ${size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'}`} />
          </span>
        ) : resolved ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolved} alt={alt} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {initials || '?'}
          </span>
        )}
        <span
          className={`pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ${dim.badge}`}
          aria-hidden
        >
          <Camera className={dim.icon} />
        </span>
      </button>
      <p className="max-w-[10rem] text-center text-[10px] leading-tight text-muted-foreground sm:max-w-none">
        Bấm ảnh để tải lên
      </p>
    </div>
  );
}
