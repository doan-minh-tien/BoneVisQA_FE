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

function mapStatus(raw: unknown): 'approved' | 'pending' | 'draft' {
  const val = String(raw ?? '').toLowerCase();
  if (val === 'approved') return 'approved';
  if (val === 'pending') return 'pending';
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
  const id = String(item.id ?? '');
  if (!id) return null;

  return {
    id,
    title: String(item.title ?? 'Untitled'),
    boneLocation: String(item.boneLocation ?? 'Unknown'),
    lesionType: String(item.lesionType ?? 'General'),
    difficulty: mapDifficulty(item.difficulty),
    status: mapStatus(item.status),
    addedBy: String(item.addedBy ?? 'Unknown'),
    addedDate: String(item.addedDate ?? ''),
    viewCount: Number(item.viewCount ?? 0),
    usageCount: Number(item.usageCount ?? 0),
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

export async function fetchExpertDashboardStats(): Promise<ExpertDashboardStats> {
  try {
    const { data } = await http.get<ExpertDashboardStats>('/api/expert/dashboard/stats');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertPendingReviews(): Promise<ExpertPendingReview[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/pending-reviews');
    const list = Array.isArray(data) ? data : [];
    return list.map(mapPendingReview).filter((item): item is ExpertPendingReview => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertRecentCases(): Promise<ExpertRecentCase[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/recent-cases');
    const list = Array.isArray(data) ? data : [];
    return list.map(mapRecentCase).filter((item): item is ExpertRecentCase => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertActivity(): Promise<ExpertActivity> {
  try {
    const { data } = await http.get<ExpertActivity>('/api/expert/dashboard/activity');
    return {
      weeklyActivity: (data.weeklyActivity ?? []).map(mapDailyActivity).filter((a): a is ExpertDailyActivity => a !== null),
      avgDailyReviews: Number(data.avgDailyReviews ?? 0),
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
