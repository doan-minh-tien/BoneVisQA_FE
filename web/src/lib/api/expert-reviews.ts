import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { ExpertReviewItem, VisualQaReport } from './types';
import { parsePercentageBoundingBox } from '@/lib/utils/annotations';

function mapExpertItem(row: unknown): ExpertReviewItem | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = String(r.id ?? r.requestId ?? '');
  if (!id) return null;
  const reportRaw = r.report ?? r.structuredReport ?? r.aiReport;
  const report: VisualQaReport = normalizeVisualQaReport(reportRaw ?? r);
  const customCoordinates = parsePercentageBoundingBox(
    r.customCoordinates ??
      r.annotationCoordinates ??
      r.questionCoordinates ??
      r.coordinates,
  );

  return {
    id,
    studentName: String(r.studentName ?? ''),
    className: r.className !== undefined ? String(r.className) : undefined,
    question: String(r.question ?? ''),
    imageUrl: r.imageUrl !== undefined ? String(r.imageUrl) : undefined,
    customCoordinates,
    askedAt: String(r.askedAt ?? ''),
    status: String(r.status ?? 'PendingExpert'),
    report,
  };
}

export async function fetchExpertReviewQueue(): Promise<ExpertReviewItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/Expert/reviews');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items: unknown[] }).items
        : [];
    return list.map(mapExpertItem).filter((x): x is ExpertReviewItem => x !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ExpertReviewUpdatePayload {
  status: 'Approved' | 'Rejected';
  suggestedDiagnosis?: string;
  keyFindings?: string;
}

export async function putExpertReview(
  requestId: string,
  payload: ExpertReviewUpdatePayload,
): Promise<void> {
  try {
    await http.put(`/api/Expert/reviews/${requestId}`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
