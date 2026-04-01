import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { ExpertReviewCitation, ExpertReviewItem, VisualQaReport } from './types';
import { parsePercentageBoundingBox } from '@/lib/utils/annotations';

function mapExpertCitation(row: unknown): ExpertReviewCitation | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const chunkId = String(r.chunkId ?? r.id ?? r.chunkID ?? '');
  const sourceText = String(r.sourceText ?? r.text ?? r.chunkText ?? r.content ?? '');
  if (!chunkId || !sourceText) return null;

  const rawFlagged = r.flagged ?? r.isFlagged ?? r.hasBeenFlagged;

  return {
    chunkId,
    sourceText,
    referenceUrl:
      r.referenceUrl !== undefined
        ? String(r.referenceUrl)
        : r.documentUrl !== undefined
          ? String(r.documentUrl)
          : undefined,
    pageNumber:
      r.pageNumber !== undefined && r.pageNumber !== null
        ? Number(r.pageNumber)
        : r.chunkOrder !== undefined && r.chunkOrder !== null
          ? Number(r.chunkOrder)
          : undefined,
    flagged: typeof rawFlagged === 'boolean' ? rawFlagged : undefined,
  };
}

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
  const citationSource = Array.isArray(r.citations)
    ? r.citations
    : Array.isArray(r.evidence)
      ? r.evidence
      : Array.isArray(r.ragCitations)
        ? r.ragCitations
        : [];
  const citations = citationSource
    .map(mapExpertCitation)
    .filter((item): item is ExpertReviewCitation => item !== null);

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
    citations,
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

export async function flagRagChunk(
  chunkId: string,
  payload: { reason: string },
): Promise<void> {
  try {
    await http.post(`/api/expert/reviews/chunks/${chunkId}/flag`, payload);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
