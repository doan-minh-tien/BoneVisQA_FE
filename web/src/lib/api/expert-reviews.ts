import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { Citation, ExpertReviewItem, VisualQaReport } from './types';
import {
  parseCustomPolygon,
  parseNormalizedBoundingBox,
  parsePercentageBoundingBox,
} from '@/lib/utils/annotations';

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
  const polyRaw = r.customPolygon ?? r.CustomPolygon;
  const dedicatedBoxRaw =
    r.customBoundingBox ?? r.CustomBoundingBox ?? r.normalizedBoundingBox ?? r.NormalizedBoundingBox;
  const customBoundingBox =
    parseNormalizedBoundingBox(dedicatedBoxRaw) ?? parseNormalizedBoundingBox(polyRaw);
  const customPolygon = customBoundingBox ? null : parseCustomPolygon(polyRaw);
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
    customBoundingBox,
    customPolygon,
    askedAt: String(r.askedAt ?? ''),
    status: String(r.status ?? 'PendingExpert'),
    report,
    citations,
    keyImagingFindings: report.keyImagingFindings ?? null,
    reflectiveQuestions: report.reflectiveQuestions ?? null,
  };
}

function unwrapReviewList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const b = data as Record<string, unknown>;
  if (Array.isArray(b.items)) return b.items;
  if (Array.isArray(b.data)) return b.data;
  const res = b.result;
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.items)) return r.items;
  }
  return [];
}

/** Primary queue: case-answer reviews; fallback to escalated. */
export async function fetchExpertReviewQueue(): Promise<ExpertReviewItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/reviews/case-answer');
    const primary = unwrapReviewList(data)
      .map(mapExpertItem)
      .filter((x): x is ExpertReviewItem => x !== null);
    if (primary.length > 0) return primary;
  } catch {
    /* fall through to escalated */
  }
  try {
    const { data } = await http.get<unknown>('/api/expert/reviews/escalated');
    return unwrapReviewList(data)
      .map(mapExpertItem)
      .filter((x): x is ExpertReviewItem => x !== null);
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

/**
 * BE `ResolveEscalatedAnswerRequestDto.DifferentialDiagnoses` is `JsonElement?`.
 * Sending a JSON array inline can bind inconsistently; a stringified array parses reliably,
 * then `NormalizeDifferentialDiagnosesForStorage` handles String vs Array.
 */
const reviewSubmitBody = (payload: ExpertReviewUpdatePayload) => ({
  answerText: payload.answerText,
  structuredDiagnosis: payload.structuredDiagnosis,
  differentialDiagnoses:
    payload.differentialDiagnoses.length > 0
      ? JSON.stringify(payload.differentialDiagnoses)
      : null,
  reviewNote: payload.reviewNote,
  keyImagingFindings: payload.keyImagingFindings ?? null,
  reflectiveQuestions: payload.reflectiveQuestions ?? null,
});

/** Approve / finalize review — prefers `POST .../approve`, falls back to legacy `.../resolve`. */
export async function putExpertReview(
  answerId: string,
  payload: ExpertReviewUpdatePayload,
): Promise<void> {
  const body = reviewSubmitBody(payload);
  try {
    await http.post(`/api/expert/reviews/${answerId}/approve`, body);
    return;
  } catch (e) {
    if (!axios.isAxiosError(e)) throw new Error(getApiErrorMessage(e));
    const st = e.response?.status;
    if (st !== 404 && st !== 405 && st !== 400) throw new Error(getApiErrorMessage(e));
  }
  try {
    await http.post(`/api/expert/reviews/${answerId}/resolve`, body);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function flagRagChunk(
  chunkId: string,
  payload: { reason: string; isFlagged?: boolean },
): Promise<void> {
  try {
    await http.post(`/api/expert/reviews/chunks/${chunkId}/flag`, {
      reason: payload.reason,
      isFlagged: payload.isFlagged ?? true,
      IsFlagged: payload.isFlagged ?? true,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
