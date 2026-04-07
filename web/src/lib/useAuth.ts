'use client';

import { useEffect, useState } from 'react';
import { http } from '@/lib/api/client';

export type BackendRole = 'Student' | 'Lecturer' | 'Expert' | 'Admin';

export interface AuthUser {
  fullName: string | null;
  email: string | null;
  activeRole: BackendRole | null;
  roles: BackendRole[];
  status: string | null;
}

function normalizeRole(raw: string | null | undefined): BackendRole | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === 'student') return 'Student';
  if (value === 'lecturer') return 'Lecturer';
  if (value === 'expert') return 'Expert';
  if (value === 'admin') return 'Admin';
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const readAuth = () => {
      const fullName = localStorage.getItem('fullName');
      const email = localStorage.getItem('email');
      const activeRole = normalizeRole(localStorage.getItem('activeRole'));
      const status = localStorage.getItem('userStatus');

      let roles: BackendRole[] = [];
      try {
        const rawRoles = JSON.parse(localStorage.getItem('roles') || '[]') as string[];
        roles = rawRoles.map((role) => normalizeRole(role)).filter((role): role is BackendRole => role !== null);
      } catch {
        roles = [];
      }

      const localUser: AuthUser = {
        fullName,
        email,
        activeRole,
        roles,
        status,
      };

      if (!cancelled) {
        setUser(localUser);
      }

      // Prefer canonical profile from API when available.
      void http
        .get<{
          fullName?: string | null;
          email?: string | null;
          activeRole?: string | null;
          role?: string | null;
          roles?: string[] | null;
          status?: string | null;
          userStatus?: string | null;
        }>('/api/users/me')
        .then((response) => {
          if (cancelled) return;
          const payload = response.data ?? {};
          const normalizedActiveRole =
            normalizeRole(payload.activeRole ?? payload.role ?? undefined) ?? localUser.activeRole;
          const normalizedRoles = Array.isArray(payload.roles)
            ? payload.roles
                .map((role) => normalizeRole(role))
                .filter((role): role is BackendRole => role !== null)
            : localUser.roles;

          setUser({
            fullName: payload.fullName ?? localUser.fullName,
            email: payload.email ?? localUser.email,
            activeRole: normalizedActiveRole,
            roles: normalizedRoles,
            status:
              payload.status ?? payload.userStatus ?? localUser.status,
          });
        })
        .catch(() => {
          // Keep local/session-derived user as fallback when /api/users/me is unavailable.
        });
    };

    readAuth();
    window.addEventListener('storage', readAuth);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', readAuth);
    };
  }, []);

  return { user };
}
