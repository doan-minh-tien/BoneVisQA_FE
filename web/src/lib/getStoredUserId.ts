/**
 * User id after sign-in is stored as `userId`. Some older code paths used `userData` JSON.
 */
export function getStoredUserId(): string {
  if (typeof window === 'undefined') return '';
  const direct = localStorage.getItem('userId');
  if (direct) return direct;
  try {
    const raw = localStorage.getItem('userData');
    if (raw) {
      const u = JSON.parse(raw) as { userId?: string };
      if (u?.userId) return String(u.userId);
    }
  } catch {
    /* ignore */
  }
  return '';
}
