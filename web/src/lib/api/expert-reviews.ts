import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { Citation, ExpertReviewItem, VisualQaReport } from './types';
import { parsePercentageBoundingBox } from '@/lib/utils/annotations';

function mapExpertCitation(row: unknown): Citation | null {
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
  const answerId = String(r.answerId ?? r.id ?? r.requestId ?? '');
  if (!answerId) return null;
  const reportRaw = r.report ?? r.structuredReport ?? r.aiReport;
  let report: VisualQaReport = normalizeVisualQaReport(reportRaw ?? r);
  if (r.keyImagingFindings !== undefined && r.keyImagingFindings !== null) {
    const v = String(r.keyImagingFindings).trim();
    report = { ...report, keyImagingFindings: v || null };
  }
  if (r.reflectiveQuestions !== undefined && r.reflectiveQuestions !== null) {
    const v = String(r.reflectiveQuestions).trim();
    report = { ...report, reflectiveQuestions: v || null };
  }
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
    .filter((item): item is Citation => item !== null);
  const questionText = String(r.questionText ?? r.question ?? '');

  return {
    answerId,
    id: answerId,
    studentName: String(r.studentName ?? ''),
    className: r.className !== undefined ? String(r.className) : undefined,
    questionText,
    question: questionText,
    imageUrl: r.imageUrl !== undefined ? String(r.imageUrl) : undefined,
    customCoordinates,
    askedAt: String(r.askedAt ?? ''),
    status: String(r.status ?? 'PendingExpert'),
    report,
    citations,
    keyImagingFindings: report.keyImagingFindings ?? null,
    reflectiveQuestions: report.reflectiveQuestions ?? null,
  };
}

export async function fetchExpertReviewQueue(): Promise<ExpertReviewItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/reviews/escalated');
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
  answerText: string;
  structuredDiagnosis: string;
  differentialDiagnoses: string[];
  reviewNote: string;
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
}

export async function putExpertReview(
  answerId: string,
  payload: ExpertReviewUpdatePayload,
): Promise<void> {
  try {
    await http.post(`/api/expert/reviews/${answerId}/resolve`, {
      answerText: payload.answerText,
      structuredDiagnosis: payload.structuredDiagnosis,
      differentialDiagnoses: payload.differentialDiagnoses,
      reviewNote: payload.reviewNote,
      keyImagingFindings: payload.keyImagingFindings ?? null,
      reflectiveQuestions: payload.reflectiveQuestions ?? null,
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
