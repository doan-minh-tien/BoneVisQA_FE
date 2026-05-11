/** Supabase Storage host should track NEXT_PUBLIC_SUPABASE_URL. */
function getSupabaseCaseHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const SUPABASE_CASE_HOST = getSupabaseCaseHost();

/**
 * When false, use `unoptimized` on `next/image` so arbitrary API/localhost URLs still render
 * without adding every backend host to `remotePatterns`.
 */
export function isNextImageRemoteOptimized(src: string): boolean {
  if (!SUPABASE_CASE_HOST) return false;
  if (!src || typeof src !== 'string') return false;
  const t = src.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  try {
    return new URL(t).hostname === SUPABASE_CASE_HOST;
  } catch {
    return false;
  }
}
