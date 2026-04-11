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
  if (/^(https?:|data:)/i.test(p)) return p;
  const base = getPublicApiOrigin();
  if (!base) return p;
  const suffix = p.startsWith('/') ? p : `/${p}`;
  return `${base}${suffix}`;
}

const baseURL = getPublicApiOrigin() || undefined;

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
    return Promise.reject(err);
  },
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
      const origin = getPublicApiOrigin();
      const hint =
        origin ||
        '(set NEXT_PUBLIC_API_URL in .env.local, e.g. http://localhost:5046 — see .env.example)';
      return `Cannot reach the API at ${hint}. Start the backend and ensure the URL matches its host and port.`;
    }
    const data = err.response?.data as unknown;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
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
          return lines.join(' ');
        }
      }

      // ProblemDetails priority: detail (specific) -> title (summary).
      if (typeof o.detail === 'string' && o.detail.trim()) return o.detail.trim();
      if (typeof o.title === 'string' && o.title.trim()) return o.title.trim();

      // Backward compatibility for legacy API shapes.
      if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
      if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
      if (Array.isArray(o.errors) && o.errors[0]) return String(o.errors[0]);
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}
