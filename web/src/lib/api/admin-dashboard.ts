import { http, getApiErrorMessage } from './client';

export interface AdminUserStat {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface AdminActivityStat {
  totalCaseViews: number;
  totalStudentQuestions: number;
  totalQuizAttempts: number;
  avgQuizScore: number;
  dailyActivity: Array<{
    date: string;
    caseViews: number;
    questions: number;
    quizAttempts: number;
  }>;
}

export interface AdminRagStat {
  totalDocuments: number;
  outdatedDocuments: number;
  totalChunks: number;
  totalCitations: number;
  topCitedDocuments: Array<{
    documentId: string;
    title: string;
    citationCount: number;
  }>;
}

export interface AdminExpertReviewStat {
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  pendingAnswers: number;
}

export interface AdminRecentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

function mapRecentUser(row: unknown): AdminRecentUser | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.userId ?? '');
  if (!id) return null;

  const role = item.role ?? item.roles ?? item.Role ?? item.Roles;
  let roleName = 'Student';
  if (Array.isArray(role)) {
    roleName = String(role[0] ?? 'Student');
  } else if (typeof role === 'string') {
    roleName = role;
  }

  return {
    id,
    fullName: String(item.fullName ?? item.fullName ?? item.userName ?? 'Unknown'),
    email: String(item.email ?? item.email ?? ''),
    role: roleName,
    isActive: Boolean(item.isActive ?? item.IsActive ?? true),
    createdAt: String(item.createdAt ?? item.CreatedAt ?? item.joinDate ?? ''),
  };
}

export async function fetchAdminUserStats(): Promise<AdminUserStat> {
  try {
    const { data } = await http.get<{ result?: AdminUserStat; message?: string }>('/api/admin/monitoring/users');
    const stats = data.result ?? (data as unknown as AdminUserStat);
    return stats;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminActivityStats(from: Date, to: Date): Promise<AdminActivityStat> {
  try {
    const { data } = await http.get<{ result?: AdminActivityStat; message?: string }>('/api/admin/monitoring/activity', {
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });
    const stats = data.result ?? (data as unknown as AdminActivityStat);
    return stats;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminRagStats(): Promise<AdminRagStat> {
  try {
    const { data } = await http.get<{ result?: AdminRagStat; message?: string }>('/api/admin/monitoring/rag');
    const stats = data.result ?? (data as unknown as AdminRagStat);
    return stats;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminExpertReviewStats(): Promise<AdminExpertReviewStat> {
  try {
    const { data } = await http.get<{ result?: AdminExpertReviewStat; message?: string }>('/api/admin/monitoring/reviews');
    const stats = data.result ?? (data as unknown as AdminExpertReviewStat);
    return stats;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminRecentUsers(): Promise<AdminRecentUser[]> {
  try {
    const { data } = await http.get<unknown>('/api/admin/users', {
      params: { pageSize: 5 },
    });
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : data && typeof data === 'object' && 'result' in data
          ? (data as { result?: unknown[] }).result ?? []
          : [];
    return list.map(mapRecentUser).filter((item): item is AdminRecentUser => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
