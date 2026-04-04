import { http, getApiErrorMessage } from './client';
import type { ClassItem, LecturerTriageRow } from './types';

export async function fetchLecturerClasses(lecturerId: string): Promise<ClassItem[]> {
  try {
    const { data } = await http.get<ClassItem[]>('/api/lecturer/classes', {
      params: { lecturerId },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapTriageRow(row: unknown): LecturerTriageRow | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = String(r.id ?? r.requestId ?? r.RequestId ?? '');
  if (!id) return null;
  return {
    id,
    studentName: String(r.studentName ?? r.StudentName ?? ''),
    questionSnippet: String(r.questionSnippet ?? r.QuestionSnippet ?? r.question ?? ''),
    thumbnailUrl: String(r.thumbnailUrl ?? r.ThumbnailUrl ?? r.imageUrl ?? ''),
    askedAt: String(r.askedAt ?? r.AskedAt ?? r.createdAt ?? ''),
    similarityScore: Number(r.similarityScore ?? r.SimilarityScore ?? 0),
    escalated: Boolean(r.escalated ?? r.Escalated ?? false),
  };
}

export async function fetchLecturerTriageList(classId: string): Promise<LecturerTriageRow[]> {
  try {
    const { data } = await http.get<unknown>('/api/lecturer/triage', {
      params: { classId },
    });
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items: unknown[] }).items
        : [];
    return list.map(mapTriageRow).filter((x): x is LecturerTriageRow => x !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function escalateToExpert(requestId: string): Promise<void> {
  try {
    await http.post(`/api/lecturer/triage/${requestId}/escalate`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
