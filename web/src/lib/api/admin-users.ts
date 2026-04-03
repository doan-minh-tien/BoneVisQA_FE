import { http, getApiErrorMessage } from './client';
import type { AdminUser } from './types';

const ADMIN_USERS = '/api/admin/users';

// ── Normalizers ─────────────────────────────────────────────────────────────

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

// ── READ ────────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data } = await http.get<unknown>(ADMIN_USERS);
    return normalizeUsersResponse(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminUser(userId: string): Promise<AdminUser> {
  try {
    const { data } = await http.get<{ result?: AdminUser } | AdminUser>(
      `${ADMIN_USERS}/${userId}`,
    );
    const result =
      'result' in data && data.result ? data.result : (data as AdminUser);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── CREATE ───────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  schoolCohort?: string;
  role: string;
  sendWelcomeEmail?: boolean;
}

export async function createAdminUser(payload: CreateUserPayload): Promise<AdminUser> {
  try {
    const { data } = await http.post<{ result?: AdminUser } | AdminUser>(
      ADMIN_USERS,
      {
        email: payload.email,
        fullName: payload.fullName,
        password: payload.password,
        schoolCohort: payload.schoolCohort ?? null,
        role: payload.role,
        sendWelcomeEmail: payload.sendWelcomeEmail ?? true,
      },
    );
    const result =
      'result' in data && data.result ? data.result : (data as AdminUser);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── UPDATE ───────────────────────────────────────────────────────────────────

export interface UpdateUserPayload {
  fullName: string;
  schoolCohort?: string;
}

export async function updateAdminUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<AdminUser> {
  try {
    const { data } = await http.put<{ result?: AdminUser } | AdminUser>(
      `${ADMIN_USERS}/${userId}`,
      {
        fullName: payload.fullName,
        schoolCohort: payload.schoolCohort ?? null,
      },
    );
    const result =
      'result' in data && data.result ? data.result : (data as AdminUser);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── ROLE & STATUS ────────────────────────────────────────────────────────────

export async function assignAdminUserRole(
  userId: string,
  role: string,
): Promise<void> {
  try {
    await http.post(`${ADMIN_USERS}/${userId}/assign-role`, {}, {
      params: { role },
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function toggleAdminUserStatus(
  userId: string,
  isActive: boolean,
): Promise<void> {
  try {
    await http.put(`${ADMIN_USERS}/${userId}/toggle-status`, { isActive });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteAdminUser(userId: string): Promise<void> {
  try {
    await http.delete(`${ADMIN_USERS}/${userId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
