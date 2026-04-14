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
  /** Profile image URL (synced with /profile and localStorage after upload). */
  avatarUrl: string | null;
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
      const avatarUrl = localStorage.getItem('avatarUrl');

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
        avatarUrl: avatarUrl?.trim() || null,
      };

      if (!cancelled) {
        setUser(localUser);
      }

      // Prefer canonical profile from API when available.
      void http
        .get<Record<string, unknown>>('/api/profile')
        .then((response) => {
          if (cancelled) return;
          const payload = response.data ?? {};
          const normalizedActiveRole =
            normalizeRole(
              (payload.activeRole ?? payload.role ?? payload.ActiveRole ?? payload.Role) as string | null | undefined,
            ) ?? localUser.activeRole;
          const rawRoles = payload.roles ?? payload.Roles;
          const normalizedRoles = Array.isArray(rawRoles)
            ? rawRoles
                .map((role) => normalizeRole(String(role)))
                .filter((role): role is BackendRole => role !== null)
            : localUser.roles;

          const rawAvatar =
            payload.avatarUrl ?? payload.AvatarUrl ?? payload.profileImageUrl ?? payload.ProfileImageUrl;
          const nextAvatar =
            rawAvatar != null && String(rawAvatar).trim() ? String(rawAvatar).trim() : localUser.avatarUrl;
          if (nextAvatar && typeof window !== 'undefined') {
            localStorage.setItem('avatarUrl', nextAvatar);
          }

          setUser({
            fullName: (payload.fullName ?? payload.FullName ?? localUser.fullName) as string | null,
            email: (payload.email ?? payload.Email ?? localUser.email) as string | null,
            activeRole: normalizedActiveRole,
            roles: normalizedRoles,
            status: (payload.status ??
              payload.userStatus ??
              payload.UserStatus ??
              localUser.status) as string | null,
            avatarUrl: nextAvatar,
          });
        })
        .catch(() => {
          // Keep local/session-derived user as fallback when /api/users/me is unavailable.
        });
    };

    readAuth();
    window.addEventListener('storage', readAuth);
    window.addEventListener('bonevis:auth-refresh', readAuth);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', readAuth);
      window.removeEventListener('bonevis:auth-refresh', readAuth);
    };
  }, []);

  return { user };
}
