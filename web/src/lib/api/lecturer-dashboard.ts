import { http, getApiErrorMessage } from './client';
import type { LecturerDashboardStats, LecturerLeaderboardEntry } from './types';

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

  return {
    studentId: item.studentId != null ? String(item.studentId) : undefined,
    studentName,
    totalCasesViewed: Number(item.totalCasesViewed ?? 0),
    totalQuestionsAsked: Number(item.totalQuestionsAsked ?? 0),
    averageQuizScore: Number(item.averageQuizScore ?? 0),
  };
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
    return list.map(mapLeaderboardEntry).filter((item): item is LecturerLeaderboardEntry => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
