import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { ExpertReviewCitation, ExpertReviewItem, VisualQaReport } from './types';
import { parsePercentageBoundingBox } from '@/lib/utils/annotations';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EscalatedCitation {
  chunkId: string;
  sourceText: string;
  referenceUrl: string;
  pageNumber: number;
}

export interface EscalatedReview {
  answerId: string;
  questionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  caseId: string;
  caseTitle: string;
  questionText: string;
  currentAnswerText: string;
  structuredDiagnosis: string;
  differentialDiagnoses: string;
  status: string;
  escalatedById: string;
  escalatedAt: string;
  aiConfidenceScore: number;
  classId: string;
  className: string;
  reviewNote: string;
  citations: EscalatedCitation[];
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapCitation(raw: unknown): EscalatedCitation {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    chunkId: String(r.chunkId ?? r.id ?? ''),
    sourceText: String(r.sourceText ?? r.text ?? ''),
    referenceUrl: String(r.referenceUrl ?? ''),
    pageNumber: Number(r.pageNumber ?? 0),
  };
}

function mapEscalated(row: unknown): EscalatedReview | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const answerId = String(r.answerId ?? '');
  if (!answerId) return null;
  return {
    answerId,
    questionId: String(r.questionId ?? ''),
    studentId: String(r.studentId ?? ''),
    studentName: String(r.studentName ?? 'Unknown'),
    studentEmail: String(r.studentEmail ?? ''),
    caseId: String(r.caseId ?? ''),
    caseTitle: String(r.caseTitle ?? 'Unknown Case'),
    questionText: String(r.questionText ?? ''),
    currentAnswerText: String(r.currentAnswerText ?? ''),
    structuredDiagnosis: String(r.structuredDiagnosis ?? ''),
    differentialDiagnoses: String(r.differentialDiagnoses ?? ''),
    status: String(r.status ?? 'Pending'),
    escalatedById: String(r.escalatedById ?? ''),
    escalatedAt: String(r.escalatedAt ?? ''),
    aiConfidenceScore: Number(r.aiConfidenceScore ?? 0),
    classId: String(r.classId ?? ''),
    className: String(r.className ?? ''),
    reviewNote: String(r.reviewNote ?? ''),
    citations: Array.isArray(r.citations) ? r.citations.map(mapCitation) : [],
  };
}

// ── API functions ──────────────────────────────────────────────────────────────

/** GET /api/expert/reviews/escalated */
export async function fetchEscalatedReviews(): Promise<EscalatedReview[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/reviews/escalated');
    const list = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
    return list.map(mapEscalated).filter((x: EscalatedReview | null): x is EscalatedReview => x !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** GET /api/expert/reviews/case-answer */
export async function fetchAllCaseAnswers(): Promise<EscalatedReview[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/reviews/case-answer');
    const list = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
    return list.map(mapEscalated).filter((x: EscalatedReview | null): x is EscalatedReview => x !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ResolveReviewPayload {
  reviewNote?: string;
  status?: string;
}

/** POST /api/expert/reviews/{answerId}/resolve */
export async function resolveEscalatedReview(
  answerId: string,
  payload: ResolveReviewPayload,
): Promise<EscalatedReview> {
  try {
    const { data } = await http.post<unknown>(`/api/expert/reviews/${answerId}/resolve`, payload);
    const mapped = mapEscalated(data);
    if (!mapped) throw new Error('Invalid response from server');
    return mapped;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** POST /api/expert/reviews/chunks/{chunkId}/flag */
export async function flagRagChunk(
  chunkId: string,
  payload: { reason: string; isFlagged?: boolean },
): Promise<void> {
  try {
    await http.post(`/api/expert/reviews/chunks/${chunkId}/flag`, {
      reason: payload.reason,
      IsFlagged: payload.isFlagged ?? true,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Legacy queue (kept for compatibility) ─────────────────────────────────────

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
