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
      if (!window.location.pathname.startsWith('/auth/sign-in')) {
        window.location.href = '/auth/sign-in';
      }
    }
    return Promise.reject(err);
  },
);

/** Lấy dòng thông báo ngắn từ chuỗi lỗi dài (HTML/stack trace từ dev middleware hoặc axios). */
function shortenExceptionMessage(raw: string): string {
  const s = raw.trim();
  if (!s) return raw;
  // JSON string từ axios: "Error: System.InvalidOperationException: ..."
  const afterColon = s.match(
    /(?:System\.)?(?:InvalidOperation|KeyNotFound|UnauthorizedAccess)Exception:\s*([^\r\n]+)/i,
  );
  if (afterColon?.[1]) return afterColon[1].trim();
  // Cắt trước "   at BoneVisQA" hoặc dòng "at ..."
  const atMatch = s.search(/\r?\n\s*at\s+[A-Za-z]/);
  if (atMatch > 0) return s.slice(0, atMatch).replace(/^Error:\s*/i, '').trim();
  const headMatch = s.match(/:\s*([^\r\n]{1,500})/);
  if (headMatch?.[1] && headMatch[1].length < s.length * 0.9) return headMatch[1].trim();
  if (s.length > 400) return `${s.slice(0, 380).trim()}…`;
  return s;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
      const base = process.env.NEXT_PUBLIC_API_URL || '(not set)';
      return `Cannot reach the API at ${base}. Start the backend and ensure NEXT_PUBLIC_API_URL matches its URL and port.`;
    }
    const data = err.response?.data as unknown;
    if (typeof data === 'string' && data.trim()) return shortenExceptionMessage(data);
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      // ASP.NET Core validation: { title, errors: { "field": ["msg"] } }
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
      const msg = o.message ?? o.title ?? o.detail ?? o.error;
      if (typeof msg === 'string') return shortenExceptionMessage(msg);
      if (Array.isArray(o.errors) && o.errors[0]) return String(o.errors[0]);
    }
    if (err.message) return shortenExceptionMessage(err.message);
  }
  if (err instanceof Error) return shortenExceptionMessage(err.message);
  return 'Request failed';
}
