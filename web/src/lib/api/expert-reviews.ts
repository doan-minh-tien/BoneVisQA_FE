import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport, normalizeVisualQaSessionReport } from './normalize-visual-qa';
import type { Citation, ExpertReviewItem, VisualQaReport, VisualQaTurn } from './types';
import {
  parseCustomPolygon,
  parseNormalizedBoundingBox,
  parsePercentageBoundingBox,
} from '@/lib/utils/annotations';

export const REVIEW_WORKFLOW_CONFLICT = 'REVIEW_WORKFLOW_CONFLICT';

function reflectiveQuestionsToNullableString(
  rq: VisualQaReport['reflectiveQuestions'],
): string | null {
  if (rq == null) return null;
  if (Array.isArray(rq)) {
    const t = rq.map((x) => String(x).trim()).filter(Boolean).join('\n');
    return t || null;
  }
  const t = String(rq).trim();
  return t || null;
}

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
  const sessionId = String(
    r.sessionId ?? r.SessionId ?? r.visualQaSessionId ?? r.VisualQaSessionId ?? r.id ?? r.requestId ?? '',
  ).trim();
  const answerIdRaw = String(r.answerId ?? r.AnswerId ?? r.caseAnswerId ?? r.CaseAnswerId ?? '').trim();
  if (!sessionId) return null;
  const turnsRaw = r.turns ?? r.Turns ?? r.history ?? r.History;
  const hasSessionTurns = Array.isArray(turnsRaw) && turnsRaw.length > 0;
  const sessionLikeRaw = hasSessionTurns
    ? {
        sessionId,
        caseId: r.caseId ?? r.CaseId ?? null,
        imageId: r.imageId ?? r.ImageId ?? null,
        turns: turnsRaw,
      }
    : null;
  const normalizedSession = sessionLikeRaw ? normalizeVisualQaSessionReport(sessionLikeRaw) : null;
  const requestedReviewMessageId = String(
    r.requestedReviewMessageId ?? r.RequestedReviewMessageId ?? '',
  ).trim();
  const selectedUserMessageId = String(
    r.selectedUserMessageId ?? r.SelectedUserMessageId ?? '',
  ).trim();
  const selectedAssistantMessageId = String(
    r.selectedAssistantMessageId ?? r.SelectedAssistantMessageId ?? '',
  ).trim();

  const matchedTurn =
    normalizedSession?.turns.find((turn) => {
      const assistantId = turn.assistantMessageId?.trim();
      const userId = turn.userMessageId?.trim();
      if (selectedAssistantMessageId && assistantId && selectedAssistantMessageId === assistantId) {
        return true;
      }
      if (selectedUserMessageId && userId && selectedUserMessageId === userId) {
        return true;
      }
      if (requestedReviewMessageId) {
        if (assistantId && assistantId === requestedReviewMessageId) return true;
        if (userId && userId === requestedReviewMessageId) return true;
      }
      return false;
    }) ?? null;
  const latestTurn = matchedTurn ?? normalizedSession?.latest ?? null;
  const allTurns: VisualQaTurn[] = normalizedSession?.turns ?? [];

  const messages = Array.isArray(r.messages) ? r.messages : [];
  const latestAssistantMessage =
    messages.length > 0
      ? [...messages]
          .reverse()
          .find((m) => {
            if (!m || typeof m !== 'object') return false;
            const mr = m as Record<string, unknown>;
            const role = String(mr.role ?? mr.Role ?? '').toLowerCase();
            return role.includes('assistant') || role === 'ai' || role === 'model';
          }) ?? null
      : null;
  const latestAssistantRecord =
    latestAssistantMessage && typeof latestAssistantMessage === 'object'
      ? (latestAssistantMessage as Record<string, unknown>)
      : null;

  const reportRaw =
    latestTurn ??
    latestAssistantRecord ??
    r.latest ??
    r.latestTurn ??
    r.report ??
    r.structuredReport ??
    r.aiReport;
  let report: VisualQaReport = normalizeVisualQaReport(reportRaw ?? r);

  if (latestTurn?.answerText?.trim()) {
    report = { ...report, answerText: latestTurn.answerText.trim() };
  } else if (latestAssistantRecord) {
    const assistantContent = String(
      latestAssistantRecord.content ??
        latestAssistantRecord.text ??
        latestAssistantRecord.answerText ??
        '',
    ).trim();
    if (assistantContent) {
      report = { ...report, answerText: assistantContent };
    }
  }
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
  const citationSource = Array.isArray(latestTurn?.citations)
    ? latestTurn.citations
    : Array.isArray(latestAssistantRecord?.citations)
      ? latestAssistantRecord?.citations
      : Array.isArray(r.citations)
    ? r.citations
    : Array.isArray(r.evidence)
      ? r.evidence
      : Array.isArray(r.ragCitations)
        ? r.ragCitations
        : [];
  const citations = citationSource
    .map(mapExpertCitation)
    .filter((item): item is Citation => item !== null);
  const sessionQuestion = latestTurn?.questionText?.trim();
  const fallbackQuestionFromMessage = (() => {
    if (messages.length === 0 || !latestAssistantRecord) return '';
    const assistantIdx = messages.findIndex((m) => m === latestAssistantMessage);
    if (assistantIdx <= 0) return '';
    for (let i = assistantIdx - 1; i >= 0; i -= 1) {
      const prev = messages[i];
      if (!prev || typeof prev !== 'object') continue;
      const pr = prev as Record<string, unknown>;
      const role = String(pr.role ?? pr.Role ?? '').toLowerCase();
      if (role.includes('user') || role.includes('student')) {
        return String(pr.content ?? pr.text ?? pr.questionText ?? '').trim();
      }
    }
    return '';
  })();
  const questionText = String(
    sessionQuestion || fallbackQuestionFromMessage || r.questionText || r.question || '',
  );

  const caseIdRaw = r.caseId ?? r.CaseId;
  const caseId =
    caseIdRaw != null && String(caseIdRaw).trim() !== '' ? String(caseIdRaw).trim() : null;
  const caseDescription = String(r.caseDescription ?? r.CaseDescription ?? '').trim() || null;
  const caseSuggestedDiagnosis =
    String(r.caseSuggestedDiagnosis ?? r.CaseSuggestedDiagnosis ?? '').trim() || null;
  const caseKeyFindings = String(r.caseKeyFindings ?? r.CaseKeyFindings ?? '').trim() || null;

  return {
    sessionId,
    answerId: answerIdRaw || null,
    id: sessionId,
    studentName: String(r.studentName ?? ''),
    className: r.className !== undefined ? String(r.className) : undefined,
    questionText,
    question: questionText,
    caseId,
    caseDescription,
    caseSuggestedDiagnosis,
    caseKeyFindings,
    imageUrl:
      r.imageUrl !== undefined
        ? String(r.imageUrl)
        : r.customImageUrl !== undefined
          ? String(r.customImageUrl)
          : undefined,
    imageId: r.imageId != null ? String(r.imageId) : null,
    customImageUrl: r.customImageUrl != null ? String(r.customImageUrl) : null,
    promotedCaseId:
      r.promotedCaseId != null
        ? String(r.promotedCaseId)
        : r.PromotedCaseId != null
          ? String(r.PromotedCaseId)
          : null,
    customCoordinates,
    customBoundingBox,
    customPolygon,
    askedAt: String(r.askedAt ?? ''),
    status: String(r.status ?? 'PendingExpert'),
    report,
    turns: allTurns,
    latestTurnIndex: latestTurn?.turnIndex ?? null,
    requestedReviewMessageId: requestedReviewMessageId || null,
    selectedUserMessageId: selectedUserMessageId || null,
    selectedAssistantMessageId: selectedAssistantMessageId || null,
    citations,
    keyImagingFindings: report.keyImagingFindings ?? null,
    reflectiveQuestions: reflectiveQuestionsToNullableString(report.reflectiveQuestions),
  };
}

/**
 * True when BE pair-selection metadata cannot be aligned with session turns (strict invariant).
 * If no pair IDs are present, returns false (nothing to verify client-side).
 */
export function hasExpertReviewSelectedPairMismatch(item: ExpertReviewItem): boolean {
  const req = item.requestedReviewMessageId?.trim();
  const su = item.selectedUserMessageId?.trim();
  const sa = item.selectedAssistantMessageId?.trim();
  if (!req && !su && !sa) return false;
  const turns = item.turns ?? [];
  if (turns.length === 0) return true;

  const matched = turns.find((turn) => {
    const assistantId = turn.assistantMessageId?.trim();
    const userId = turn.userMessageId?.trim();
    if (sa && assistantId && sa === assistantId) return true;
    if (su && userId && su === userId) return true;
    if (req) {
      if (assistantId && assistantId === req) return true;
      if (userId && userId === req) return true;
    }
    return false;
  });
  if (!matched) return true;
  if (su && matched.userMessageId?.trim() && su !== matched.userMessageId.trim()) return true;
  if (sa && matched.assistantMessageId?.trim() && sa !== matched.assistantMessageId.trim()) return true;
  if (
    req &&
    req !== matched.userMessageId?.trim() &&
    req !== matched.assistantMessageId?.trim()
  ) {
    return true;
  }
  return false;
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

/**
 * Persist expert-reviewed outcome (answer text, diagnoses, notes).
 * BE: POST `/api/expert/reviews/{sessionId}/resolve` — this also sets session status to ExpertApproved.
 * Status-only finalize without storing expert content uses `approveExpertReview` (POST `.../approve`).
 */
export async function putExpertReview(
  sessionId: string,
  payload: ExpertReviewUpdatePayload,
): Promise<void> {
  const body = reviewSubmitBody(payload);
  try {
    await http.post(`/api/expert/reviews/${sessionId}/resolve`, body);
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 409 || e.response?.status === 412)) {
      throw new Error(REVIEW_WORKFLOW_CONFLICT);
    }
    throw new Error(getApiErrorMessage(e));
  }
}

export async function postExpertResponse(
  sessionId: string,
  content: string,
): Promise<void> {
  const id = String(sessionId ?? '').trim();
  const message = String(content ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  if (!message) throw new Error('Feedback content is required.');
  try {
    await http.post(`/api/expert/reviews/${encodeURIComponent(id)}/respond`, {
      content: message,
    });
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 409 || e.response?.status === 412)) {
      throw new Error(REVIEW_WORKFLOW_CONFLICT);
    }
    throw new Error(getApiErrorMessage(e));
  }
}

export async function approveExpertReview(sessionId: string): Promise<void> {
  const id = String(sessionId ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  try {
    await http.post(`/api/expert/reviews/${encodeURIComponent(id)}/approve`);
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 409 || e.response?.status === 412)) {
      throw new Error(REVIEW_WORKFLOW_CONFLICT);
    }
    throw new Error(getApiErrorMessage(e));
  }
}

export interface PromoteExpertReviewPayload {
  description: string;
  suggestedDiagnosis: string;
  keyFindings: string;
  reflectiveQuestions: string;
}

export async function promoteExpertReview(
  sessionId: string,
  payload: PromoteExpertReviewPayload,
): Promise<string | null> {
  const id = String(sessionId ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  const body = {
    description: String(payload.description ?? '').trim(),
    suggestedDiagnosis: String(payload.suggestedDiagnosis ?? '').trim(),
    keyFindings: String(payload.keyFindings ?? '').trim(),
    reflectiveQuestions: String(payload.reflectiveQuestions ?? '').trim(),
  };
  if (!body.description || !body.suggestedDiagnosis || !body.keyFindings || !body.reflectiveQuestions) {
    throw new Error('All promote fields are required.');
  }
  try {
    const { data } = await http.post<unknown>(`/api/expert/reviews/${encodeURIComponent(id)}/promote`, body);
    if (!data || typeof data !== 'object') return null;
    const record = data as Record<string, unknown>;
    const direct =
      record.promotedCaseId ??
      record.PromotedCaseId ??
      record.caseId ??
      record.CaseId ??
      null;
    if (direct != null) return String(direct);
    const nestedData = record.data;
    if (nestedData && typeof nestedData === 'object') {
      const nested = nestedData as Record<string, unknown>;
      const nestedId =
        nested.promotedCaseId ?? nested.PromotedCaseId ?? nested.caseId ?? nested.CaseId ?? null;
      if (nestedId != null) return String(nestedId);
    }
    const nestedResult = record.result;
    if (nestedResult && typeof nestedResult === 'object') {
      const nested = nestedResult as Record<string, unknown>;
      const nestedId =
        nested.promotedCaseId ?? nested.PromotedCaseId ?? nested.caseId ?? nested.CaseId ?? null;
      if (nestedId != null) return String(nestedId);
    }
    return null;
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 409 || e.response?.status === 412)) {
      throw new Error(REVIEW_WORKFLOW_CONFLICT);
    }
    throw new Error(getApiErrorMessage(e));
  }
}

export async function flagRagChunk(
  chunkId: string,
  payload: { reason: string; isFlagged?: boolean },
): Promise<void> {
  try {
    await http.post(`/api/expert/documents/chunks/${chunkId}/flag`, {
      reason: payload.reason,
      isFlagged: payload.isFlagged ?? true,
      IsFlagged: payload.isFlagged ?? true,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
