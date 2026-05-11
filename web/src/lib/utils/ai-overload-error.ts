import axios from 'axios';

/**
 * Detects backend overload / rate-limit responses (e.g. Gemini busy after Polly retries).
 */
export function isAiModelOverloadError(err: unknown): boolean {
  if (!axios.isAxiosError(err) || !err.response) return false;
  const status = err.response.status;
  if (status === 503 || status === 429) return true;

  const data = err.response.data;
  const title =
    data && typeof data === 'object' && 'title' in data
      ? String((data as { title?: unknown }).title ?? '')
      : '';
  const detail =
    data && typeof data === 'object' && 'detail' in data
      ? String((data as { detail?: unknown }).detail ?? '')
      : '';
  const message =
    data && typeof data === 'object' && 'message' in data
      ? String((data as { message?: unknown }).message ?? '')
      : typeof data === 'string'
        ? data
        : '';
  const combined = `${title} ${detail} ${message}`.toLowerCase();
  if (
    /(too many requests|service unavailable|overload|rate limit|throttl|temporar(il)?y unavailable|gemini|retry)/i.test(
      combined,
    )
  ) {
    return true;
  }
  return false;
}
