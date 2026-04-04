import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** BE gốc chỉ là origin + port, ví dụ http://localhost:5046 — không thêm /api/... */
function normalizeApiBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  // Tránh lỗi 404: user lỡ để NEXT_PUBLIC_API_URL=.../api/Lecturers rồi FE gọi /api/lecturer/classes → URL tách đôi sai
  u = u.replace(/\/api\/Lecturers$/i, '').replace(/\/api\/lecturer$/i, '');
  return u.replace(/\/+$/, '');
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

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')) {
      const base = process.env.NEXT_PUBLIC_API_URL || '(not set)';
      return `Cannot reach the API at ${base}. Start the backend and ensure NEXT_PUBLIC_API_URL matches its URL and port.`;
    }
    const data = err.response?.data as unknown;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      const msg = o.message ?? o.title ?? o.detail ?? o.error;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(o.errors) && o.errors[0]) return String(o.errors[0]);
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}
