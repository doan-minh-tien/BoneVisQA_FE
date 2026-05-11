/**
 * Human-readable relative time (Messenger-style), e.g. "18 minutes ago".
 * Uses `Intl.RelativeTimeFormat` with sensible English units; falls back to short date.
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  locale: string = 'en',
  nowMs: number = Date.now(),
): string {
  const raw = iso?.trim();
  if (!raw) return '';
  const d = new Date(raw);
  const t = d.getTime();
  if (Number.isNaN(t)) return raw;

  const sec = Math.round((t - nowMs) / 1000);
  const absSec = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSec < 45) return rtf.format(0, 'second');
  if (absSec < 90) return rtf.format(Math.round(sec / 60), 'minute');
  if (absSec < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (absSec < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (absSec < 604800) return rtf.format(Math.round(sec / 86400), 'day');
  if (absSec < 2_592_000) return rtf.format(Math.round(sec / 604800), 'week');
  if (absSec < 31_536_000) return rtf.format(Math.round(sec / 2_592_000), 'month');
  return rtf.format(Math.round(sec / 31_536_000), 'year');
}
