import { http, getApiErrorMessage } from './client';
import type { AdminUser } from './types';

const ADMIN_USERS = '/api/admin/users';

// ── Normalizers ─────────────────────────────────────────────────────────────

function unwrapUserList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const body = data as Record<string, unknown>;

  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.users)) return body.users;
  if (Array.isArray(body.data)) return body.data;

  if (body.result && typeof body.result === 'object') {
    const resultObj = body.result as Record<string, unknown>;
    if (Array.isArray(resultObj.items)) return resultObj.items;
    if (Array.isArray(resultObj.users)) return resultObj.users;
    if (Array.isArray(resultObj.data)) return resultObj.data;
  }

  if (Array.isArray(body.result)) return body.result;
  return [];
}

function normalizeUser(item: unknown): AdminUser | null {
  if (!item || typeof item !== 'object') return null;
  const user = item as Record<string, unknown>;

  const id = String(user.id ?? user.userId ?? user.userID ?? '').trim();
  const email = String(user.email ?? user.userEmail ?? '').trim();
  if (!id || !email) return null;

  const rawRoles = user.roles ?? user.Roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((role) => String(role).trim()).filter(Boolean)
    : user.role
      ? [String(user.role).trim()]
      : [];

  const rawIsActive = user.isActive ?? user.IsActive ?? user.active ?? user.Active;
  const isActive =
    typeof rawIsActive === 'boolean'
      ? rawIsActive
      : typeof rawIsActive === 'number'
        ? rawIsActive > 0
        : String(rawIsActive ?? '').toLowerCase() !== 'false';

  return {
    id,
    fullName: String(user.fullName ?? user.name ?? user.userName ?? email).trim(),
    email,
    roles,
    isActive,
    createdAt: user.createdAt ? String(user.createdAt) : undefined,
    schoolCohort: user.schoolCohort ? String(user.schoolCohort) : undefined,
  };
}

function normalizeUsersResponse(data: unknown): AdminUser[] {
  return unwrapUserList(data)
    .map(normalizeUser)
    .filter((item): item is AdminUser => item !== null);
}

// ── READ ────────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    // Canonical contract: GET /api/admin/users (often paginated as { items, totalCount, ... }).
    const { data } = await http.get<unknown>(ADMIN_USERS, {
      params: { page: 1, pageSize: 500 },
    });
    const primary = normalizeUsersResponse(data);
    if (primary.length > 0) return primary;

    // Fallback for older role-based endpoints if deployment is mixed-version.
    const rolesToFetch = ['Student', 'Lecturer', 'Expert', 'Admin', 'Pending'];
    const responses = await Promise.all(
      rolesToFetch.map(async (role) => {
        try {
          const res = await http.get<unknown>(`/api/admin/role/${role}`);
          return { role, users: normalizeUsersResponse(res.data) };
        } catch {
          return { role, users: [] as AdminUser[] };
        }
      }),
    );

    const dedup = new Map<string, AdminUser>();
    for (const res of responses) {
      for (const user of res.users) {
        if (!user.roles || user.roles.length === 0) user.roles = [res.role];
        dedup.set(user.id, user);
      }
    }
    return Array.from(dedup.values());
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

// ── Class management ───────────────────────────────────────────────────────────

export interface UserClassInfo {
  id: string;
  className: string;
  relationType: 'Lecturer' | 'Student';
  enrolledAt: string | null;
}

export interface AvailableClass {
  id: string;
  className: string;
  lecturerName: string | null;
  studentCount: number;
}

export async function fetchUserClasses(userId: string): Promise<UserClassInfo[]> {
  try {
    const { data } = await http.get<{ result?: UserClassInfo[] } | UserClassInfo[]>(
      `${ADMIN_USERS}/${userId}/classes`,
    );
    const list = 'result' in data ? data.result : (data as UserClassInfo[]);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAvailableClasses(): Promise<AvailableClass[]> {
  try {
    const { data } = await http.get<{ result?: AvailableClass[] } | AvailableClass[]>(
      `${ADMIN_USERS}/classes`,
    );
    const list = 'result' in data ? data.result : (data as AvailableClass[]);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function assignUserToClass(userId: string, classId: string): Promise<UserClassInfo> {
  try {
    const { data } = await http.post<{ result?: UserClassInfo } | UserClassInfo>(
      `${ADMIN_USERS}/${userId}/classes`,
      { classId },
    );
    const result = 'result' in data ? data.result : (data as UserClassInfo);
    if (!result) throw new Error('No result from server.');
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function removeUserFromClass(userId: string, classId: string): Promise<void> {
  try {
    await http.delete(`${ADMIN_USERS}/${userId}/classes/${classId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Medical Student Verification ────────────────────────────────────────────────

export interface PendingVerification {
  userId: string;
  fullName: string;
  email: string;
  schoolCohort: string | null;
  isMedicalStudent: boolean;
  medicalSchool: string | null;
  medicalStudentId: string | null;
  verificationStatus: string | null;
  createdAt: string | null;
}

export interface ApproveVerificationPayload {
  isApproved: boolean;
  notes?: string;
}

export async function fetchPendingVerifications(): Promise<PendingVerification[]> {
  try {
    const { data } = await http.get<{ result?: PendingVerification[] } | PendingVerification[]>(
      `${ADMIN_USERS}/verifications/pending`,
    );
    const list = 'result' in data ? data.result : (data as PendingVerification[]);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function approveMedicalVerification(
  userId: string,
  payload: ApproveVerificationPayload,
): Promise<AdminUser> {
  try {
    const { data } = await http.put<{ result?: AdminUser } | AdminUser>(
      `${ADMIN_USERS}/${userId}/verifications/approve`,
      payload,
    );
    const result = 'result' in data ? data.result : (data as AdminUser);
    if (!result) throw new Error('No result from server.');
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
