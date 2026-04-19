import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * When `NEXT_PUBLIC_API_URL` is unset, local dev uses this origin (no `/api` suffix).
 * All axios paths are like `/api/...`, so the base must be e.g. `http://localhost:5046`, not `.../api`.
 * Do not commit other ports (e.g. 5000) here — override in `.env.local` if your backend differs.
 */
const DEV_FALLBACK_API_ORIGIN = 'http://localhost:5046';

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
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('activeRole');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    // Log chi tiết lỗi để debug
    if (err.response) {
      console.warn(`[API] HTTP ${err.response.status}: ${err.config?.url}`, err.response.data);
    } else if (err.request) {
      console.warn(`[API] No response from ${err.config?.url} — server may be offline or unreachable.`);
    }
    return Promise.reject(err);
  },
);

export function getApiErrorMessage(err: unknown): string {
  let raw = 'Request failed';

  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
      const origin = getPublicApiOrigin();
      const hint =
        origin ||
        '(set NEXT_PUBLIC_API_URL in .env.local, e.g. http://localhost:5046 — see .env.example)';
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
