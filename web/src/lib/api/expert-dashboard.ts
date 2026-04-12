import axios from 'axios';
import { http, getApiErrorMessage } from './client';

export interface ExpertDashboardStats {
  totalCases: number;
  totalReviews: number;
  pendingReviews: number;
  approvedThisMonth: number;
  studentInteractions: number;
}

export interface ExpertPendingReview {
  id: string;
  studentName: string;
  caseTitle: string;
  questionSnippet: string;
  aiAnswerSnippet: string;
  submittedAt: string;
  priority: 'high' | 'normal' | 'low';
  category: string;
}

export interface ExpertRecentCase {
  id: string;
  title: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  status: 'approved' | 'pending' | 'draft';
  addedBy: string;
  addedDate: string;
  viewCount: number;
  usageCount: number;
}

export interface ExpertDailyActivity {
  day: string;
  reviews: number;
  cases: number;
}

export interface ExpertActivity {
  weeklyActivity: ExpertDailyActivity[];
  avgDailyReviews: number;
}

function mapPriority(raw: unknown): 'high' | 'normal' | 'low' {
  const val = String(raw ?? '').toLowerCase();
  if (val === 'high') return 'high';
  if (val === 'low') return 'low';
  return 'normal';
}

function mapDifficulty(raw: unknown): 'basic' | 'intermediate' | 'advanced' {
  const val = String(raw ?? '').toLowerCase();
  if (val === 'advanced') return 'advanced';
  if (val === 'intermediate') return 'intermediate';
  return 'basic';
}

function pickDisplayStr(value: unknown, fallback: string): string {
  const s = value != null ? String(value).trim() : '';
  return s || fallback;
}

function mapRecentCaseStatus(item: Record<string, unknown>): ExpertRecentCase['status'] {
  const s = String(item.status ?? item.Status ?? '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'pending') return 'pending';
  if (s === 'draft') return 'draft';
  if (s === 'rejected') return 'draft';
  if (Boolean(item.isApproved ?? item.IsApproved)) return 'approved';
  if (Boolean(item.isActive ?? item.IsActive)) return 'pending';
  return 'draft';
}

function mapPendingReview(row: unknown): ExpertPendingReview | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? '');
  if (!id) return null;

  return {
    id,
    studentName: String(item.studentName ?? 'Unknown'),
    caseTitle: String(item.caseTitle ?? 'Unknown Case'),
    questionSnippet: String(item.questionSnippet ?? ''),
    aiAnswerSnippet: String(item.aiAnswerSnippet ?? ''),
    submittedAt: String(item.submittedAt ?? item.submittedAt ?? ''),
    priority: mapPriority(item.priority),
    category: String(item.category ?? 'General'),
  };
}

function mapRecentCase(row: unknown): ExpertRecentCase | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.Id ?? '');
  if (!id) return null;

  const boneLocation = pickDisplayStr(
    item.boneLocation ?? item.BoneLocation ?? item.anatomicalRegion ?? item.AnatomicalRegion,
    '—',
  );
  const addedBy = pickDisplayStr(
    item.expertName ?? item.ExpertName ?? item.addedBy ?? item.AddedBy,
    '—',
  );
  const addedRaw = String(
    item.addedDate ?? item.AddedDate ?? item.createdAt ?? item.created_at ?? item.CreatedAt ?? '',
  ).trim();

  return {
    id,
    title: pickDisplayStr(item.title ?? item.Title, 'Untitled'),
    boneLocation,
    lesionType: pickDisplayStr(
      item.categoryName ?? item.category_name ?? item.CategoryName ?? item.lesionType ?? item.LesionType,
      '—',
    ),
    difficulty: mapDifficulty(item.difficulty ?? item.Difficulty),
    status: mapRecentCaseStatus(item),
    addedBy,
    addedDate: addedRaw,
    viewCount: Number(item.viewCount ?? item.ViewCount ?? 0),
    usageCount: Number(item.usageCount ?? item.UsageCount ?? 0),
  };
}

function mapDailyActivity(row: unknown): ExpertDailyActivity | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  return {
    day: String(item.day ?? ''),
    reviews: Number(item.reviews ?? 0),
    cases: Number(item.cases ?? 0),
  };
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const b = data as Record<string, unknown>;
  if (Array.isArray(b.items)) return b.items;
  if (Array.isArray(b.data)) return b.data;
  if (Array.isArray(b.results)) return b.results;
  const res = b.result;
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.items)) return r.items;
    if (Array.isArray(r.data)) return r.data;
  }
  return [];
}

export async function fetchExpertDashboardStats(): Promise<ExpertDashboardStats> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/stats');
    if (data && typeof data === 'object' && 'result' in data && (data as { result: unknown }).result) {
      return (data as { result: ExpertDashboardStats }).result;
    }
    return data as ExpertDashboardStats;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertPendingReviews(): Promise<ExpertPendingReview[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/pending-reviews');
    return unwrapList(data)
      .map(mapPendingReview)
      .filter((item): item is ExpertPendingReview => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertRecentCases(): Promise<ExpertRecentCase[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/recent-cases');
    return unwrapList(data)
      .map(mapRecentCase)
      .filter((item): item is ExpertRecentCase => item !== null);
  } catch (e) {
    if (axios.isAxiosError(e)) throw e;
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertActivity(): Promise<ExpertActivity> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/activity');
    const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const nested =
      body.result && typeof body.result === 'object' ? (body.result as Record<string, unknown>) : null;
    const weeklyRaw = Array.isArray(body.weeklyActivity)
      ? body.weeklyActivity
      : nested && Array.isArray(nested.weeklyActivity)
        ? nested.weeklyActivity
        : [];
    const avgRaw = body.avgDailyReviews ?? nested?.avgDailyReviews ?? 0;
    return {
      weeklyActivity: weeklyRaw
        .map(mapDailyActivity)
        .filter((a): a is ExpertDailyActivity => a !== null),
      avgDailyReviews: Number(avgRaw ?? 0),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Single bundle for SWR — one cache key, parallel requests, shared loading/error. */
export type ExpertDashboardBundle = {
  stats: ExpertDashboardStats;
  pendingReviews: ExpertPendingReview[];
  recentCases: ExpertRecentCase[];
  activity: ExpertActivity;
};

export async function fetchExpertDashboardBundle(): Promise<ExpertDashboardBundle> {
  const [stats, pendingReviews, recentCases, activity] = await Promise.all([
    fetchExpertDashboardStats(),
    fetchExpertPendingReviews(),
    fetchExpertRecentCases(),
    fetchExpertActivity(),
  ]);
  return { stats, pendingReviews, recentCases, activity };
}
