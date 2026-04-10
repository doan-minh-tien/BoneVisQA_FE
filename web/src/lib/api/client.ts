import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** BE gốc chỉ là origin + port, ví dụ http://localhost:5046 — không thêm /api/... */
export function normalizeApiBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  // Tránh lỗi 404: user lỡ để NEXT_PUBLIC_API_URL=.../api/Lecturers rồi FE gọi /api/lecturer/classes → URL tách đôi sai
  u = u.replace(/\/api\/Lecturers$/i, '').replace(/\/api\/lecturer$/i, '');
  return u.replace(/\/+$/, '');
}

/**
 * Ảnh/static từ BE trả về path kiểu `/uploads/images/...` — trình duyệt không được dùng origin Next (3000).
 * Ghép với NEXT_PUBLIC_API_URL để img src trỏ đúng server API.
 */
export function resolveApiAssetUrl(path: string | null | undefined): string {
  if (path == null || !String(path).trim()) return '';
  const p = String(path).trim();
  if (/^(https?:|data:)/i.test(p)) return p;
  const base = normalizeApiBaseUrl(
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || ''
      : process.env.NEXT_PUBLIC_API_URL || '',
  );
  if (!base) return p;
  const suffix = p.startsWith('/') ? p : `/${p}`;
  return `${base}${suffix}`;
}

const baseURL = normalizeApiBaseUrl(
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || ''
    : process.env.NEXT_PUBLIC_API_URL || '',
);

export const http = axios.create({
  baseURL: baseURL || undefined,
  timeout: 180_000,
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
      const base = process.env.NEXT_PUBLIC_API_URL || '(not set)';
      return `Cannot reach the API at ${base}. Start the backend and ensure NEXT_PUBLIC_API_URL matches its URL and port.`;
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
