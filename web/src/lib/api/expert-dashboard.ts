import { http, getApiErrorMessage } from './client';

// ── Stats ──────────────────────────────────────────────────────────────────

export interface ExpertStats {
  totalCases: number;
  totalReviews: number;
  pendingReviews: number;
  approvedThisMonth: number;
  studentInteractions: number;
}

// ── Pending Reviews ──────────────────────────────────────────────────────────

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

// ── Recent Cases ─────────────────────────────────────────────────────────────

export interface ExpertRecentCase {
  id: string;
  title: string;
  lesionType: string;
  difficulty: string;
  status: string;
  addedBy: string;
  addedDate: string;
  viewCount: number;
  usageCount: number;
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface ExpertDailyActivity {
  day: string;
  reviews: number;
  cases: number;
}

export interface ExpertActivity {
  weeklyActivity: ExpertDailyActivity[];
  avgDailyReviews: number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapPriority(raw: unknown): 'high' | 'normal' | 'low' {
  const val = String(raw ?? '').toLowerCase();
  if (val === 'high') return 'high';
  if (val === 'low') return 'low';
  return 'normal';
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
    submittedAt: String(item.submittedAt ?? ''),
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
    lesionType: String(item.lesionType ?? '—'),
    difficulty: String(item.difficulty ?? '—'),
    status: String(item.status ?? '—'),
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

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/expert/dashboard/pending-reviews */
export async function fetchExpertPendingReviews(): Promise<ExpertPendingReview[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/pending-reviews');
    // API may return array directly or wrapped in { items: [] }
    const raw = data as any;
    const list: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return list.map(mapPendingReview).filter((item): item is ExpertPendingReview => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** GET /api/expert/dashboard/recent-cases */
export async function fetchExpertRecentCases(): Promise<ExpertRecentCase[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/dashboard/recent-cases');
    const raw = data as any;
    const list: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return list.map(mapRecentCase).filter((item): item is ExpertRecentCase => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** GET /api/expert/dashboard/activity */
export async function fetchExpertActivity(): Promise<ExpertActivity> {
  try {
    const { data } = await http.get<any>('/api/expert/dashboard/activity');
    const rawActivity = Array.isArray(data?.weeklyActivity) ? data.weeklyActivity : [];
    return {
      weeklyActivity: rawActivity
        .map(mapDailyActivity)
        .filter((a: ExpertDailyActivity | null): a is ExpertDailyActivity => a !== null),
      avgDailyReviews: Number(data?.avgDailyReviews ?? 0),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** GET /api/expert/dashboard/stats */
export async function fetchExpertStats(): Promise<ExpertStats> {
  try {
    const { data } = await http.get<ExpertStats>('/api/expert/dashboard/stats');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
