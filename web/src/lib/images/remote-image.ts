/** Supabase Storage host configured in `next.config.ts` `images.remotePatterns`. */
const SUPABASE_CASE_HOST = 'jshryhplbayoymtthqpu.supabase.co';

/**
 * When false, use `unoptimized` on `next/image` so arbitrary API/localhost URLs still render
 * without adding every backend host to `remotePatterns`.
 */
export function isNextImageRemoteOptimized(src: string): boolean {
  if (!src || typeof src !== 'string') return false;
  const t = src.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  try {
    return new URL(t).hostname === SUPABASE_CASE_HOST;
  } catch {
    return false;
  }
}
