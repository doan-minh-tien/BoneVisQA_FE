/**
 * Next.js `router.push` expects an in-app path. API may return absolute URLs
 * (e.g. same host with origin) — strip to pathname + search.
 */
export function notificationTargetToAppPath(targetUrl: string): string {
  const t = targetUrl.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      return `${u.pathname}${u.search}` || '/';
    } catch {
      return t;
    }
  }
  return t.startsWith('/') ? t : `/${t}`;
}
