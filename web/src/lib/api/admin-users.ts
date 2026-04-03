import { http, getApiErrorMessage } from './client';
import type { AdminUser } from './types';

const ADMIN_USERS = '/api/admin/users';

function normalizeUsersResponse(data: unknown): AdminUser[] {
  console.log('RAW API RESPONSE DATA:', data);
  const rawList =
    Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'result' in data
        ? (data as { result?: unknown }).result
      : data && typeof data === 'object' && 'data' in data
        ? (data as { data?: unknown }).data
      : data && typeof data === 'object' && 'users' in data
        ? (data as { users?: unknown }).users
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown }).items
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
    const rolesToFetch = ['Student', 'Lecturer', 'Expert', 'Admin', 'Pending'];
    const responses = await Promise.all(
      rolesToFetch.map(async (r) => {
        try {
          const res = await http.get<unknown>(`/api/Admin/role/${r}`);
          return { role: r, data: res.data };
        } catch {
          return { role: r, data: [] }; // gracefully handle missing/empty roles
        }
      })
    );

    let allUsers: AdminUser[] = [];
    for (const res of responses) {
      const normalized = normalizeUsersResponse(res.data);
      // Ensure the role is set so the UI tabs work correctly
      for (const u of normalized) {
        if (!u.roles || u.roles.length === 0) {
          u.roles = [res.role];
        } else if (u.roles[0] === 'Unassigned') {
          u.roles = [res.role];
        }
      }
      allUsers = allUsers.concat(normalized);
    }
    return allUsers;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function assignAdminUserRole(userId: string, role: string): Promise<void> {
  try {
    await http.post(`${ADMIN_USERS}/${userId}/assign-role`, { roles: [role] });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function toggleAdminUserStatus(userId: string, isActive: boolean): Promise<void> {
  try {
    await http.put(`${ADMIN_USERS}/${userId}/toggle-status`, { isActive });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
