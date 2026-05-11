/**
 * Get basic user info stored from sign-in response.
 * Mirrors the LoginResponse shape from types.
 */
export interface StoredUserInfo {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
}

export function getStoredUserInfo(): StoredUserInfo {
  if (typeof window === 'undefined') {
    return { userId: '', fullName: '', email: '', roles: [] };
  }

  const userId = localStorage.getItem('userId') ?? '';
  const email = localStorage.getItem('email') ?? '';

  // Mutable so we can populate from userData blob as fallback
  let fullName = localStorage.getItem('fullName') ?? '';
  let roles: string[] = [];

  try {
    const r = localStorage.getItem('roles');
    if (r) roles = JSON.parse(r) as string[];
  } catch {
    /* ignore */
  }

  // Fallback: try to read from userData JSON blob
  if (!fullName || roles.length === 0) {
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const u = JSON.parse(raw) as Record<string, unknown>;
        if (!fullName && u.fullName) fullName = String(u.fullName);
        if (roles.length === 0 && u.roles) {
          roles = (u.roles as unknown[])?.map(String) ?? [];
        }
      }
    } catch {
      /* ignore */
    }
  }

  return { userId, fullName, email, roles };
}
