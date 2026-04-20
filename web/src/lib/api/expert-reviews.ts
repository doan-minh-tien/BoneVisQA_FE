import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import type { ExpertPendingReview } from './expert-dashboard';
import { fetchExpertPendingReviews } from './expert-dashboard';
import { normalizeVisualQaReport, normalizeVisualQaSessionReport } from './normalize-visual-qa';
import type { Citation, ExpertReviewItem, VisualQaReport, VisualQaTurn } from './types';
import {
  parseCustomPolygon,
  parseNormalizedBoundingBox,
  parsePercentageBoundingBox,
} from '@/lib/utils/annotations';

export const REVIEW_WORKFLOW_CONFLICT = 'REVIEW_WORKFLOW_CONFLICT';

function normalizeReviewMessageId(raw: string | null | undefined): string {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('{') && s.endsWith('}')) s = s.slice(1, -1).trim();
  return s.toLowerCase();
}

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

function parseDifferentialDiagnosesList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      return raw
        .split(/[\n;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
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
  const answerIdRaw = String(r.answerId ?? r.AnswerId ?? r.caseAnswerId ?? r.CaseAnswerId ?? '').trim();
  const sessionId = String(
    r.sessionId ??
      r.SessionId ??
      r.visualQaSessionId ??
      r.VisualQaSessionId ??
      (answerIdRaw || undefined) ??
      r.id ??
      r.requestId ??
      '',
  ).trim();
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
      const assistantId = normalizeReviewMessageId(turn.assistantMessageId);
      const userId = normalizeReviewMessageId(turn.userMessageId);
      const saN = normalizeReviewMessageId(selectedAssistantMessageId);
      const suN = normalizeReviewMessageId(selectedUserMessageId);
      const reqN = normalizeReviewMessageId(requestedReviewMessageId);
      if (saN && assistantId && saN === assistantId) {
        return true;
      }
      if (suN && userId && suN === userId) {
        return true;
      }
      if (reqN) {
        if (assistantId && assistantId === reqN) return true;
        if (userId && userId === reqN) return true;
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
  } else {
    const currentAnswerFlat = String(r.currentAnswerText ?? r.CurrentAnswerText ?? '').trim();
    if (currentAnswerFlat) {
      report = { ...report, answerText: currentAnswerFlat };
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

  const structuredDiagnosis = String(r.structuredDiagnosis ?? r.StructuredDiagnosis ?? '').trim();
  if (structuredDiagnosis) {
    report = { ...report, suggestedDiagnosis: structuredDiagnosis };
  } else {
    const caseSugg = String(r.caseSuggestedDiagnosis ?? r.CaseSuggestedDiagnosis ?? '').trim();
    if (caseSugg && report.suggestedDiagnosis?.trim() === caseSugg) {
      report = { ...report, suggestedDiagnosis: '' };
    }
  }

  const diffFromDto = parseDifferentialDiagnosesList(r.differentialDiagnoses ?? r.DifferentialDiagnoses);
  if (diffFromDto.length > 0) {
    report = { ...report, differentialDiagnoses: diffFromDto, keyFindings: diffFromDto };
  } else {
    const caseKf = String(r.caseKeyFindings ?? r.CaseKeyFindings ?? '').trim();
    const kfJoined = report.keyFindings.length > 0 ? report.keyFindings.join('\n').trim() : '';
    if (caseKf && kfJoined && kfJoined === caseKf) {
      report = { ...report, keyFindings: [], differentialDiagnoses: report.differentialDiagnoses ?? [] };
    }
  }

  const confRaw = r.aiConfidenceScore ?? r.AiConfidenceScore;
  if (typeof confRaw === 'number' && Number.isFinite(confRaw)) {
    report = { ...report, aiConfidenceScore: confRaw };
  } else if (typeof confRaw === 'string' && confRaw.trim()) {
    const n = parseFloat(confRaw);
    if (Number.isFinite(n)) report = { ...report, aiConfidenceScore: n };
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
  const caseTitle =
    String(r.caseTitle ?? r.CaseTitle ?? r.caseName ?? r.CaseName ?? '').trim() || null;

  const askedAtRaw =
    r.escalatedAt ??
    r.EscalatedAt ??
    r.askedAt ??
    r.AskedAt ??
    r.submittedAt ??
    r.SubmittedAt ??
    '';

  return {
    sessionId,
    answerId: answerIdRaw || null,
    id: sessionId,
    studentName: String(r.studentName ?? ''),
    className: r.className !== undefined ? String(r.className) : undefined,
    questionText,
    question: questionText,
    caseId,
    caseTitle,
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
    askedAt: String(askedAtRaw ?? ''),
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
    queueSource: 'queue',
  };
}

/** When `/reviews/case-answer` and `/reviews/escalated` are empty but dashboard still lists pending items. */
function mapDashboardPendingToExpertItem(row: ExpertPendingReview): ExpertReviewItem | null {
  const sessionId = String(row.id ?? '').trim();
  if (!sessionId) return null;
  const report = normalizeVisualQaReport({
    answerText: row.aiAnswerSnippet,
    suggestedDiagnosis: '',
    keyFindings: [],
    differentialDiagnoses: [],
  });
  return {
    sessionId,
    answerId: null,
    id: sessionId,
    studentName: row.studentName,
    questionText: row.questionSnippet,
    question: row.questionSnippet,
    caseId: row.caseId ?? null,
    caseTitle: row.caseTitle?.trim() ? row.caseTitle : null,
    askedAt: row.submittedAt || '',
    status: 'PendingExpert',
    report,
    turns: [],
    citations: [],
    queueSource: 'dashboard-summary',
  };
}

/**
 * True when BE pair-selection metadata cannot be aligned with session turns (strict invariant).
 * If no pair IDs are present, returns false (nothing to verify client-side).
 */
export function hasExpertReviewSelectedPairMismatch(item: ExpertReviewItem): boolean {
  const req = normalizeReviewMessageId(item.requestedReviewMessageId);
  const su = normalizeReviewMessageId(item.selectedUserMessageId);
  const sa = normalizeReviewMessageId(item.selectedAssistantMessageId);
  if (!req && !su && !sa) return false;
  const turns = item.turns ?? [];
  if (turns.length === 0) return true;

  const matched = turns.find((turn) => {
    const assistantId = normalizeReviewMessageId(turn.assistantMessageId);
    const userId = normalizeReviewMessageId(turn.userMessageId);
    if (sa && assistantId && sa === assistantId) return true;
    if (su && userId && su === userId) return true;
    if (req) {
      if (assistantId && assistantId === req) return true;
      if (userId && userId === req) return true;
    }
    return false;
  });
  if (!matched) return true;
  const mUser = normalizeReviewMessageId(matched.userMessageId);
  const mAsst = normalizeReviewMessageId(matched.assistantMessageId);
  if (su && mUser && su !== mUser) return true;
  if (sa && mAsst && sa !== mAsst) return true;
  if (req && req !== mUser && req !== mAsst) {
    return true;
  }
  return false;
}

const REVIEW_LIST_ARRAY_KEYS = [
  'pendingReviews',
  'sessions',
  'reviews',
  'escalated',
  'caseAnswers',
  'queue',
] as const;

function firstArrayFromRecord(rec: Record<string, unknown>): unknown[] | null {
  for (const key of REVIEW_LIST_ARRAY_KEYS) {
    const v = rec[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/** Align envelopes with `expert-dashboard` `unwrapList` plus common Visual QA queue property names. */
function unwrapReviewList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const b = data as Record<string, unknown>;
  if (Array.isArray(b.items)) return b.items;
  if (Array.isArray(b.data)) return b.data;
  if (Array.isArray(b.results)) return b.results;
  const fromRoot = firstArrayFromRecord(b);
  if (fromRoot) return fromRoot;
  const res = b.result;
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.items)) return r.items;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.results)) return r.results;
    const nested = firstArrayFromRecord(r);
    if (nested) return nested;
  }
  return [];
}

/** Primary queue: case-answer reviews; fallback to escalated; then dashboard pending list if both are empty. */
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
    const secondary = unwrapReviewList(data)
      .map(mapExpertItem)
      .filter((x): x is ExpertReviewItem => x !== null);
    if (secondary.length > 0) return secondary;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
  try {
    const pending = await fetchExpertPendingReviews();
    return pending
      .map(mapDashboardPendingToExpertItem)
      .filter((x): x is ExpertReviewItem => x !== null);
  } catch {
    return [];
  }
}

export interface ExpertReviewUpdatePayload {
  answerText: string;
  structuredDiagnosis: string;
  differentialDiagnoses: string[];
  reviewNote: string;
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  correctedRoiBoundingBox?: number[] | null;
  decision?: 'approve' | 'reject';
}

const reviewSubmitBody = (payload: ExpertReviewUpdatePayload) => {
  const roi = payload.correctedRoiBoundingBox;
  const roiBody =
    Array.isArray(roi) && roi.length >= 4 && roi.slice(0, 4).every((n) => Number.isFinite(n))
      ? { correctedRoiBoundingBox: roi.slice(0, 4) }
      : {};
  const decisionBody =
    payload.decision !== undefined ? { decision: payload.decision } : {};
  return {
    answerText: payload.answerText,
    structuredDiagnosis: payload.structuredDiagnosis,
    differentialDiagnoses:
      payload.differentialDiagnoses.length > 0
        ? JSON.stringify(payload.differentialDiagnoses)
        : null,
    reviewNote: payload.reviewNote,
    keyImagingFindings: payload.keyImagingFindings ?? null,
    reflectiveQuestions: payload.reflectiveQuestions ?? null,
    ...roiBody,
    ...decisionBody,
  };
};

export interface ExpertReviewDraftPayload {
  reviewNote?: string;
  correctedRoiBoundingBox?: number[];
}

export async function putExpertReviewDraft(
  sessionId: string,
  payload: ExpertReviewDraftPayload,
): Promise<void> {
  const id = String(sessionId ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  const body: Record<string, unknown> = {};
  if (payload.reviewNote !== undefined) body.reviewNote = payload.reviewNote;
  const roi = payload.correctedRoiBoundingBox;
  if (Array.isArray(roi) && roi.length >= 4 && roi.slice(0, 4).every((n) => Number.isFinite(n))) {
    body.correctedRoiBoundingBox = roi.slice(0, 4);
  }
  try {
    await http.put(`/api/expert/reviews/${encodeURIComponent(id)}/draft`, body);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function deleteExpertReviewDraft(sessionId: string): Promise<void> {
  const id = String(sessionId ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  try {
    await http.delete(`/api/expert/reviews/${encodeURIComponent(id)}/draft`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function resolveExpertReview(
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
  options?: { correctedRoiBoundingBox?: number[] | null },
): Promise<void> {
  const id = String(sessionId ?? '').trim();
  const message = String(content ?? '').trim();
  if (!id) throw new Error('Session id is required.');
  if (!message) throw new Error('Feedback content is required.');
  const roi = options?.correctedRoiBoundingBox;
  const body: { content: string; correctedRoiBoundingBox?: number[] } = { content: message };
  if (Array.isArray(roi) && roi.length >= 4) {
    body.correctedRoiBoundingBox = roi.slice(0, 4);
  }
  try {
    await http.post(`/api/expert/reviews/${encodeURIComponent(id)}/respond`, body);
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
