import { http, getApiErrorMessage } from './client';
import type { AdminUser } from './types';

function normalizeUsersResponse(data: unknown): AdminUser[] {
  const rawList =
    Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'result' in data
        ? (data as { result?: unknown }).result
        : data;

  const list = Array.isArray(rawList) ? rawList : [];

  const normalized: AdminUser[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const user = item as Record<string, unknown>;
    const id = String(user.id ?? user.userId ?? '');
    const fullName = String(user.fullName ?? user.name ?? '');
    const email = String(user.email ?? '');
    if (!id || !email) continue;

    const rawRoles = user.roles;
    const roles = Array.isArray(rawRoles)
      ? rawRoles.map((role) => String(role))
      : user.role
        ? [String(user.role)]
        : [];

    normalized.push({
      id,
      fullName: fullName || email,
      email,
      roles,
      isActive: Boolean(user.isActive ?? true),
      createdAt: user.createdAt ? String(user.createdAt) : undefined,
      schoolCohort: user.schoolCohort ? String(user.schoolCohort) : undefined,
    });
  }

  return normalized;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data } = await http.get<unknown>('/api/Admin/users');
    return normalizeUsersResponse(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function assignAdminUserRole(userId: string, role: string): Promise<void> {
  try {
    await http.post(`/api/Admin/${userId}/assign-role`, { roles: [role] });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function toggleAdminUserStatus(userId: string, isActive: boolean): Promise<void> {
  try {
    await http.put(`/api/admin/users/${userId}/toggle-status`, { isActive });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
