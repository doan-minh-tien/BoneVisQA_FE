import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** When true, the global response interceptor will not show a Sonner toast for this request. */
    skipApiToast?: boolean;
  }
}
