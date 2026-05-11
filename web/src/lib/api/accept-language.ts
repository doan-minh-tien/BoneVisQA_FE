/**
 * Browser i18n: i18next stores the active code in `localStorage` (see i18next-browser-languagedetector).
 * Used for the `Accept-Language` header on API calls.
 */
export function getClientAcceptLanguageHeader(): string {
  if (typeof window === 'undefined') {
    return 'en-US,en;q=0.9';
  }
  const fromI18n = localStorage.getItem('i18nextLng')?.trim();
  const code = (fromI18n || navigator.language || 'en').split('-')[0].toLowerCase();
  if (code === 'vi') {
    return 'vi-VN,vi;q=0.9,en;q=0.8';
  }
  const nav = navigator.language || 'en-US';
  return `${nav},${code};q=0.9,en;q=0.8`;
}
