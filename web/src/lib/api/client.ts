import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getClientAcceptLanguageHeader } from '@/lib/api/accept-language';

/**
 * When `NEXT_PUBLIC_API_URL` is unset, local dev uses this origin (no `/api` suffix).
 * All axios paths are like `/api/...`, so the base must be e.g. `http://localhost:5046`, not `.../api`.
 * Do not commit other ports (e.g. 5000) here — override in `.env.local` if your backend differs.
 */
const DEV_FALLBACK_API_ORIGIN = 'https://localhost:5047';

/** BE gốc chỉ là origin + port, ví dụ http://localhost:5046 — không thêm /api/... */
export function normalizeApiBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  // Tránh lỗi 404: user lỡ để NEXT_PUBLIC_API_URL=.../api/Lecturers rồi FE gọi /api/lecturer/classes → URL tách đôi sai
  u = u.replace(/\/api\/Lecturers$/i, '').replace(/\/api\/lecturer$/i, '');
  return u.replace(/\/+$/, '');
}

/**
 * Single source of truth for the public API origin (client + server bundles).
 * 1) `NEXT_PUBLIC_API_URL` when set (after normalize)
 * 2) In non-production only: `DEV_FALLBACK_API_ORIGIN` (team baseline)
 * 3) Production without env: empty (fail loud; never guess a teammate's machine)
 */
export function getPublicApiOrigin(): string {
  const fromEnv = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL?.trim() ?? '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== 'production') {
    return DEV_FALLBACK_API_ORIGIN;
  }
  return '';
}

/**
 * Ảnh/static từ BE trả về path kiểu `/uploads/images/...` — trình duyệt không được dùng origin Next (3000).
 * Ghép với cùng origin như axios (`getPublicApiOrigin`).
 */
export function resolveApiAssetUrl(path: string | null | undefined): string {
  if (path == null || !String(path).trim()) return '';
  const p = String(path).trim();
  // Absolute URLs (e.g. Supabase storage) must never be prefixed with API origin
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (/^(https?:|data:)/i.test(p)) return p;
  const base = getPublicApiOrigin();
  if (!base) return p;
  const suffix = p.startsWith('/') ? p : `/${p}`;
  return `${base}${suffix}`;
}

/** Append `?v=` / `&v=` for API-reported document revision (cache-safe); skips if `v` already present. */
export function withVersionedAssetUrl(resolvedUrl: string, version?: string | null): string {
  if (!resolvedUrl?.trim() || !version?.trim()) return resolvedUrl;
  if (/[?&]v=/.test(resolvedUrl)) return resolvedUrl;
  const sep = resolvedUrl.includes('?') ? '&' : '?';
  return `${resolvedUrl}${sep}v=${encodeURIComponent(version.trim())}`;
}

const baseURL = getPublicApiOrigin() || undefined;

/** Base URL của BE để dùng trực tiếp, ví dụ: axios đến /api/... */
export const API_BASE_URL = baseURL || '';

export const http = axios.create({
  baseURL,
  timeout: 60_000,
  headers: {
    Accept: 'application/json',
  },
});

type ProblemDetailsPayload = {
  title?: unknown;
  detail?: unknown;
  status?: unknown;
  type?: unknown;
  instance?: unknown;
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

/**
 * ASP.NET / EF Core often returns ProblemDetails with a multi-line LINQ translation error.
 * End users should not see DbSet / Where stack text in toasts — the fix belongs in the API.
 */
/** Strip UUIDs, long paths, and stack-like fragments before showing API text in toasts. */
export function sanitizeForUserToast(raw: string): string {
  let s = raw.trim();
  if (!s) return 'Something went wrong. Please try again.';
  s = s.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    '',
  );
  s = s.replace(/\b[0-9a-f]{32}\b/gi, '');
  s = s.replace(/\/[^\s]+\.(cs|dll)(:\d+)?\b/gi, '');
  s = s.replace(/\bat\s+[^\n]+(?:line\s+\d+)?/gi, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  if (s.length > 220) s = `${s.slice(0, 217)}…`;
  if (!s || /^[\s.,;:]+$/.test(s)) return 'Something went wrong. Please try again.';
  return s;
}

function queueSonnerErrorToast(message: string) {
  if (typeof window === 'undefined') return;
  void import('sonner')
    .then(({ toast }) => toast.error(message))
    .catch(() => {});
}

function friendlyGlobalApiToastMessage(err: AxiosError): string | null {
  const st = err.response?.status;
  if (st === 400) {
    const msg = sanitizeForUserToast(getApiErrorMessage(err));
    if (msg.length < 180 && !looksLikeTechnicalErrorMessage(msg)) return msg;
    return 'The request could not be processed. Please check your input and try again.';
  }
  if (st === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (st !== undefined && st >= 500) {
    const msg = sanitizeForUserToast(getApiErrorMessage(err));
    if (looksLikeTechnicalErrorMessage(msg)) {
      return 'The server ran into a problem. Please try again in a moment.';
    }
    return msg;
  }
  return null;
}

export function polishUserFacingApiErrorMessage(message: string): string {
  const s = message.trim();
  if (!s) return message;
  if (/LINQ expression/i.test(s) && /could not be translated/i.test(s)) {
    return (
      'The server could not run this admin query (Entity Framework cannot translate it to SQL). ' +
      'A backend change is required, for example rewriting filters that call application code inside IQueryable.Where. ' +
      'Reloading the page will not fix it.'
    );
  }
  return message;
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = getClientAcceptLanguageHeader();
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const cfg = err.config as (InternalAxiosRequestConfig & { skipApiToast?: boolean }) | undefined;
    const skipToast = Boolean(cfg?.skipApiToast);
    if (
      !skipToast &&
      typeof window !== 'undefined' &&
      axios.isAxiosError(err) &&
      err.response?.status &&
      err.response.status !== 401
    ) {
      const friendly = friendlyGlobalApiToastMessage(err);
      if (friendly) queueSonnerErrorToast(friendly);
    }
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('activeRole');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    if (process.env.NODE_ENV === 'development') {
      if (err.response) {
        console.warn(`[API] HTTP ${err.response.status}: ${err.config?.url}`, err.response.data);
      } else if (err.request) {
        console.warn(
          `[API] No response from ${err.config?.url} — server may be offline or unreachable.`,
        );
      }
    }
    return Promise.reject(err);
  },
);

function looksLikeTechnicalErrorMessage(message: string): boolean {
  const s = message.trim();
  if (!s || s.length > 220) return true;
  return /exception|stack|trace|LINQ|SqlClient|DbUpdate|System\.|Microsoft\.|timeout of \d+ms/i.test(s);
}

/** Safe short messages for login / Google OAuth UI — never expose stack traces or Axios internals. */
export function sanitizeUserFacingLoginMessage(message: string | null | undefined, fallback: string): string {
  const s = (message ?? '').trim();
  if (!s) return fallback;
  if (looksLikeTechnicalErrorMessage(s)) return fallback;
  return s;
}

const GENERIC_GOOGLE_SIGNIN_FAILED =
  'Google sign-in could not be completed. Please try again or use email and password.';

/**
 * Maps HTTP/network failures to concise English copy for the auth screens.
 */
export function getPublicAuthErrorMessage(err: unknown, context: 'google' | 'credentials'): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || /timeout of \d+ms exceeded/i.test(err.message ?? '')) {
      return context === 'google'
        ? 'Sign-in timed out. Check that the API server is running, then try again.'
        : 'The request timed out. Please try again.';
    }
    if (!err.response) {
      return context === 'google'
        ? 'Cannot reach the sign-in service. Check your network and ensure the backend API is running.'
        : 'Cannot reach the server. Check your network and try again.';
    }
    const st = err.response.status;
    if (context === 'credentials') {
      if (st === 401) return 'Invalid email or password.';
      if (st === 403) return 'Sign-in was not allowed. Contact support if this continues.';
      if (st >= 500) return 'The server is temporarily unavailable. Please try again later.';
      const msg = getApiErrorMessage(err);
      return looksLikeTechnicalErrorMessage(msg) ? 'Sign-in failed. Please try again.' : msg;
    }
    if (st === 401 || st === 403) {
      return 'Google sign-in could not be verified. If this continues, ask an administrator to check Google OAuth settings (client ID and authorized origins).';
    }
    if (st >= 500) return 'The server could not complete Google sign-in. Please try again later.';
    if (st === 404) return 'Sign-in service was not found. Contact support if this continues.';
    const msg = getApiErrorMessage(err);
    return looksLikeTechnicalErrorMessage(msg) ? GENERIC_GOOGLE_SIGNIN_FAILED : msg;
  }
  if (err instanceof Error) {
    if (/did not return a credential|credential token/i.test(err.message)) {
      return 'Google did not complete sign-in. Please try again.';
    }
    return context === 'google' ? GENERIC_GOOGLE_SIGNIN_FAILED : 'Sign-in failed. Please try again.';
  }
  return context === 'google' ? GENERIC_GOOGLE_SIGNIN_FAILED : 'Sign-in failed. Please try again.';
}

export function getApiErrorMessage(err: unknown): string {
  let raw = 'Request failed';

  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
      const origin = getPublicApiOrigin();
      const hint =
        origin ||
        '(set NEXT_PUBLIC_API_URL in .env.local, e.g. https://localhost:5047 — see .env.example)';
      raw = `Cannot reach the API at ${hint}. Start the backend and ensure the URL matches its host and port.`;
      return raw;
    }
    const data = err.response?.data as unknown;
    if (typeof data === 'string' && data.trim()) raw = data.trim();
    else if (data && typeof data === 'object') {
      const o = data as ProblemDetailsPayload;
      // ASP.NET Core / .NET 8 validation: RFC 7807 + `errors` map.
      const errMap = o.errors;
      if (errMap && typeof errMap === 'object' && !Array.isArray(errMap)) {
        const lines: string[] = [];
        for (const [, v] of Object.entries(errMap as Record<string, unknown>)) {
          if (Array.isArray(v)) {
            for (const item of v) {
              if (typeof item === 'string' && item.trim()) lines.push(item.trim());
            }
          } else if (typeof v === 'string' && v.trim()) {
            lines.push(v.trim());
          }
        }
        if (lines.length > 0) {
          raw = lines.join(' ');
        }
      }

      if (raw === 'Request failed') {
        // ProblemDetails priority: detail (specific) -> title (summary).
        if (typeof o.detail === 'string' && o.detail.trim()) raw = o.detail.trim();
        else if (typeof o.title === 'string' && o.title.trim()) raw = o.title.trim();
        // Backward compatibility for legacy API shapes.
        else if (typeof o.message === 'string' && o.message.trim()) raw = o.message.trim();
        else if (typeof o.error === 'string' && o.error.trim()) raw = o.error.trim();
        else if (Array.isArray(o.errors) && o.errors[0]) raw = String(o.errors[0]);
      }
    }
    if (raw === 'Request failed' && err.message) raw = err.message;
    return polishUserFacingApiErrorMessage(raw);
  }
  if (err instanceof Error) return polishUserFacingApiErrorMessage(err.message);
  return polishUserFacingApiErrorMessage(raw);
}

/** RFC 7807 / ASP.NET ProblemDetails — use for toasts and inline error copy. */
export function getApiProblemDetails(err: unknown): {
  title: string;
  detail?: string;
  status?: number;
} {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    if (data && typeof data === 'object') {
      const o = data as ProblemDetailsPayload;
      const title =
        typeof o.title === 'string' && o.title.trim()
          ? polishUserFacingApiErrorMessage(o.title.trim())
          : status === 404
            ? 'Not found'
            : status === 500
              ? 'Server error'
              : 'Request failed';
      const detailRaw = typeof o.detail === 'string' && o.detail.trim() ? o.detail.trim() : undefined;
      const detail = detailRaw ? polishUserFacingApiErrorMessage(detailRaw) : undefined;
      if (detail || title) return { title, detail, status };
    }
    return { title: getApiErrorMessage(err), status };
  }
  if (err instanceof Error) return { title: err.message };
  return { title: 'Request failed' };
}

/**
 * Returns a headers object with Authorization token for raw fetch requests.
 * Use the `http` axios instance instead when possible (it handles this automatically).
 */
export function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Extracts and throws the API error from a fetch Response.
 * Handles both success (returns parsed JSON) and error responses.
 */
export async function getResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
      else if (data?.detail) message = data.detail;
      else if (data?.title) message = data.title;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // use default message
      }
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
