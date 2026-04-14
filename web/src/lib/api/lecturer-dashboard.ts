import { http, getApiErrorMessage } from './client';
import type { LecturerDashboardStats, LecturerLeaderboardEntry } from './types';

function optStr(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function optDateStr(v: unknown): string | undefined {
  const s = optStr(v);
  if (!s) return undefined;
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export async function fetchLecturerDashboardStats(): Promise<LecturerDashboardStats> {
  try {
    const { data } = await http.get<LecturerDashboardStats>('/api/lecturer/dashboard/stats');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapLeaderboardEntry(row: unknown): LecturerLeaderboardEntry | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const studentName = String(item.studentName ?? item.fullName ?? '');
  if (!studentName) return null;

  const entry: LecturerLeaderboardEntry = {
    studentName,
    totalCasesViewed: Number(item.totalCasesViewed ?? 0),
    totalQuestionsAsked: Number(item.totalQuestionsAsked ?? 0),
    averageQuizScore: Number(item.averageQuizScore ?? 0),
  };
  if (item.studentId != null && String(item.studentId).trim() !== '') {
    entry.studentId = String(item.studentId);
  }
  return entry;
}

export async function fetchLecturerClassLeaderboard(
  classId: string,
): Promise<LecturerLeaderboardEntry[]> {
  try {
    const { data } = await http.get<unknown>('/api/lecturer/monitoring/class-leaderboard', {
      params: { classId },
    });
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list.map(mapLeaderboardEntry).filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Lecturer Analytics ─────────────────────────────────────────────────────────

export interface LecturerAnalyticsData {
  classPerformance: Array<{
    classId: string;
    className: string;
    semester: string;
    studentCount: number;
    totalCasesViewed: number;
    avgQuizScore: number | null;
    completionRate: number;
    trendPercent: number;
    totalQuestions: number;
    escalatedCount: number;
  }>;
  topicScores: Array<{
    topic: string;
    avgScore: number;
    attempts: number;
    commonErrors: string[];
  }>;
  topStudents: LecturerLeaderboardEntry[];
  bottomStudents: LecturerLeaderboardEntry[];
}

function mapClassPerfRow(item: unknown): LecturerAnalyticsData['classPerformance'][0] {
  const o = item as Record<string, unknown>;
  return {
    classId: String(o.classId ?? o.ClassId ?? ''),
    className: String(o.className ?? o.ClassName ?? ''),
    semester: String(o.semester ?? o.Semester ?? ''),
    studentCount: Number(o.studentCount ?? o.StudentCount ?? 0),
    totalCasesViewed: Number(o.totalCasesViewed ?? o.TotalCasesViewed ?? 0),
    avgQuizScore: (() => { const v = o.avgQuizScore ?? o.AvgQuizScore; return typeof v === 'number' ? v : null; })(),
    completionRate: Number(o.completionRate ?? o.CompletionRate ?? 0),
    trendPercent: Number(o.trendPercent ?? o.TrendPercent ?? 0),
    totalQuestions: Number(o.totalQuestions ?? o.TotalQuestions ?? 0),
    escalatedCount: Number(o.escalatedCount ?? o.EscalatedCount ?? 0),
  };
}

function mapTopicRow(item: unknown): LecturerAnalyticsData['topicScores'][0] {
  const o = item as Record<string, unknown>;
  const avgScore = Number(o.avgScore ?? o.AvgScore ?? 0);
  const attempts = Number(o.attempts ?? o.Attempts ?? 0);
  return {
    topic: String(o.topic ?? o.Topic ?? ''),
    avgScore: isNaN(avgScore) ? 0 : avgScore,
    attempts: isNaN(attempts) ? 0 : attempts,
    commonErrors: Array.isArray(o.commonErrors ?? o.CommonErrors)
      ? (o.commonErrors as unknown[]).map(String)
      : [],
  };
}

export async function fetchLecturerAnalytics(): Promise<LecturerAnalyticsData> {
  try {
    const { data } = await http.get<unknown>('/api/lecturer/dashboard/analytics');
    const r = data as Record<string, unknown>;
    return {
      classPerformance: Array.isArray(r.classPerformance ?? r.ClassPerformance)
        ? (r.classPerformance as unknown[]).map(mapClassPerfRow)
        : [],
      topicScores: Array.isArray(r.topicScores ?? r.TopicScores)
        ? (r.topicScores as unknown[]).map(mapTopicRow)
        : [],
      topStudents: Array.isArray(r.topStudents ?? r.TopStudents)
        ? (r.topStudents as unknown[]).map(mapLeaderboardEntry).filter((x): x is NonNullable<typeof x> => x !== null)
        : [],
      bottomStudents: Array.isArray(r.bottomStudents ?? r.BottomStudents)
        ? (r.bottomStudents as unknown[]).map(mapLeaderboardEntry).filter((x): x is NonNullable<typeof x> => x !== null)
        : [],
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Lecturer Profile ──────────────────────────────────────────────────────────

export interface LecturerProfile {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  roles: string[];
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
  // Preferences
  notifyNewStudent: boolean;
  notifyQuizComplete: boolean;
  notifyNewQuestion: boolean;
}

export interface UpdateLecturerProfilePayload {
  fullName: string;
  department?: string;
  avatarUrl?: string;
  dateOfBirth?: string | null;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
  notifyNewStudent: boolean;
  notifyQuizComplete: boolean;
  notifyNewQuestion: boolean;
}

function mapLecturerProfile(raw: Record<string, unknown>): LecturerProfile {
  return {
    id: String(raw.id ?? ''),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    department: optStr(raw.department),
    avatarUrl: optStr(raw.avatarUrl),
    isActive: Boolean(raw.isActive ?? true),
    createdAt: optStr(raw.createdAt),
    updatedAt: optStr(raw.updatedAt),
    lastLogin: optStr(raw.lastLogin),
    roles: Array.isArray(raw.roles) ? (raw.roles as unknown[]).map(String) : [],
    dateOfBirth: optDateStr(raw.dateOfBirth),
    phoneNumber: optStr(raw.phoneNumber),
    gender: optStr(raw.gender),
    studentSchoolId: optStr(raw.studentSchoolId),
    classCode: optStr(raw.classCode),
    address: optStr(raw.address),
    bio: optStr(raw.bio),
    emergencyContact: optStr(raw.emergencyContact),
    notifyNewStudent: Boolean(raw.notifyNewStudent ?? true),
    notifyQuizComplete: Boolean(raw.notifyQuizComplete ?? true),
    notifyNewQuestion: Boolean(raw.notifyNewQuestion ?? false),
  };
}

export async function fetchLecturerProfile(): Promise<LecturerProfile> {
  try {
    const { data } = await http.get<unknown>('/api/lecturer/profile');
    return mapLecturerProfile(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateLecturerProfile(
  payload: UpdateLecturerProfilePayload,
): Promise<LecturerProfile> {
  try {
    const { data } = await http.put<unknown>('/api/lecturer/profile', payload);
    return mapLecturerProfile(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Expert Profile ───────────────────────────────────────────────────────────

export interface ExpertProfile {
  id: string;
  fullName: string;
  email: string;
  specialty?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  roles: string[];
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
  autoApproveThreshold: number;
  notifyNewQA: boolean;
  notifyFlagged: boolean;
  notifyQuizComplete: boolean;
}

export interface UpdateExpertProfilePayload {
  fullName: string;
  specialty?: string;
  avatarUrl?: string;
  dateOfBirth?: string | null;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
  autoApproveThreshold: number;
  notifyNewQA: boolean;
  notifyFlagged: boolean;
  notifyQuizComplete: boolean;
}

function mapExpertProfile(raw: Record<string, unknown>): ExpertProfile {
  const rolesFromActive =
    raw.activeRole != null && String(raw.activeRole).trim()
      ? [String(raw.activeRole)]
      : [];
  const rolesList = Array.isArray(raw.roles) ? (raw.roles as unknown[]).map(String) : rolesFromActive;
  return {
    id: String(raw.id ?? raw.userId ?? ''),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    specialty: optStr(raw.specialty),
    avatarUrl: optStr(raw.avatarUrl),
    isActive: Boolean(raw.isActive ?? true),
    createdAt: optStr(raw.createdAt),
    updatedAt: optStr(raw.updatedAt),
    lastLogin: optStr(raw.lastLogin),
    roles: rolesList.length > 0 ? rolesList : ['Expert'],
    dateOfBirth: optDateStr(raw.dateOfBirth),
    phoneNumber: optStr(raw.phoneNumber),
    gender: optStr(raw.gender),
    studentSchoolId: optStr(raw.studentSchoolId),
    classCode: optStr(raw.classCode ?? raw.schoolCohort),
    address: optStr(raw.address),
    bio: optStr(raw.bio),
    emergencyContact: optStr(raw.emergencyContact),
    autoApproveThreshold: Number(raw.autoApproveThreshold ?? 90),
    notifyNewQA: Boolean(raw.notifyNewQA ?? true),
    notifyFlagged: Boolean(raw.notifyFlagged ?? true),
    notifyQuizComplete: Boolean(raw.notifyQuizComplete ?? false),
  };
}

/** Canonical profile — `GET /api/profile`. */
export async function fetchExpertProfile(): Promise<ExpertProfile> {
  try {
    const { data } = await http.get<unknown>('/api/profile');
    return mapExpertProfile(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Canonical profile update — `PUT /api/profile` (expert-only prefs kept client-side if BE omits them). */
export async function updateExpertProfile(
  payload: UpdateExpertProfilePayload,
): Promise<ExpertProfile> {
  try {
    const { data } = await http.put<unknown>('/api/profile', {
      fullName: payload.fullName,
      schoolCohort: payload.classCode?.trim() || null,
      phoneNumber: payload.phoneNumber?.trim() || null,
      bio: payload.bio?.trim() || null,
      address: payload.address?.trim() || null,
    });
    const mapped = mapExpertProfile(data as Record<string, unknown>);
    return {
      ...mapped,
      fullName: payload.fullName || mapped.fullName,
      specialty: payload.specialty ?? mapped.specialty,
      avatarUrl: payload.avatarUrl ?? mapped.avatarUrl,
      dateOfBirth: payload.dateOfBirth ?? mapped.dateOfBirth,
      phoneNumber: payload.phoneNumber ?? mapped.phoneNumber,
      gender: payload.gender ?? mapped.gender,
      studentSchoolId: payload.studentSchoolId ?? mapped.studentSchoolId,
      classCode: payload.classCode ?? mapped.classCode,
      address: payload.address ?? mapped.address,
      bio: payload.bio ?? mapped.bio,
      emergencyContact: payload.emergencyContact ?? mapped.emergencyContact,
      autoApproveThreshold: payload.autoApproveThreshold,
      notifyNewQA: payload.notifyNewQA,
      notifyFlagged: payload.notifyFlagged,
      notifyQuizComplete: payload.notifyQuizComplete,
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Admin Profile ─────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  roles: string[];
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
}

export interface UpdateAdminProfilePayload {
  fullName: string;
  avatarUrl?: string;
  dateOfBirth?: string | null;
  phoneNumber?: string;
  gender?: string;
  studentSchoolId?: string;
  classCode?: string;
  address?: string;
  bio?: string;
  emergencyContact?: string;
}

function mapAdminProfile(raw: Record<string, unknown>): AdminProfile {
  return {
    id: String(raw.id ?? ''),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    avatarUrl: optStr(raw.avatarUrl),
    isActive: Boolean(raw.isActive ?? true),
    createdAt: optStr(raw.createdAt),
    updatedAt: optStr(raw.updatedAt),
    lastLogin: optStr(raw.lastLogin),
    roles: Array.isArray(raw.roles) ? (raw.roles as unknown[]).map(String) : [],
    dateOfBirth: optDateStr(raw.dateOfBirth),
    phoneNumber: optStr(raw.phoneNumber),
    gender: optStr(raw.gender),
    studentSchoolId: optStr(raw.studentSchoolId),
    classCode: optStr(raw.classCode),
    address: optStr(raw.address),
    bio: optStr(raw.bio),
    emergencyContact: optStr(raw.emergencyContact),
  };
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  try {
    const { data } = await http.get<unknown>('/api/admin/profile');
    return mapAdminProfile(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateAdminProfile(
  payload: UpdateAdminProfilePayload,
): Promise<AdminProfile> {
  try {
    const { data } = await http.put<unknown>('/api/admin/profile', payload);
    return mapAdminProfile(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
