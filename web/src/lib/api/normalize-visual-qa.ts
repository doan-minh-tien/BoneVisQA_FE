import type {
  VisualQaCitation,
  VisualQaMessage,
  VisualQaReport,
  VisualQaSessionReport,
  VisualQaTurn,
} from './types';
import { parseNormalizedBoundingBox } from '@/lib/utils/annotations';

function pick<T extends object>(o: T, keys: string[]): unknown {
  for (const k of keys) {
    if (k in o && (o as Record<string, unknown>)[k] !== undefined) {
      return (o as Record<string, unknown>)[k];
    }
  }
  return undefined;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x : String(x)));
}

function asNullableString(v: unknown): string | null {
  const normalized = asString(v).trim();
  return normalized || null;
}

function asNullableNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeRootPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};

  const base = raw as Record<string, unknown>;
  const nestedCandidate = pick(base, ['data']);
  if (nestedCandidate && nestedCandidate !== raw) {
    if (nestedCandidate && typeof nestedCandidate === 'object' && !Array.isArray(nestedCandidate)) {
      const normalizedNested = normalizeRootPayload(nestedCandidate);
      if (Object.keys(normalizedNested).length > 0) return normalizedNested;
    }
  }
  return base;
}

function reflectiveQuestionsReportToTurnArray(
  rq: VisualQaReport['reflectiveQuestions'],
): string[] | undefined {
  if (rq == null) return undefined;
  if (Array.isArray(rq)) return rq.map((x) => String(x).trim()).filter(Boolean);
  const s = String(rq).trim();
  return s ? [s] : undefined;
}

function normalizeVisualQaMessage(raw: unknown): VisualQaMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const role = asString(pick(m, ['role'])).trim();
  const content = asString(pick(m, ['content'])).trim();
  if (!content) return null;
  const createdAtRaw = pick(m, ['createdAt']);
  return {
    role: role || 'Assistant',
    content,
    createdAt: typeof createdAtRaw === 'string' ? createdAtRaw : null,
  };
}

export function normalizeVisualQaReport(raw: unknown): VisualQaReport {
  const o = normalizeRootPayload(raw);
  const questionText = asString(pick(o, ['questionText'])).trim();
  const answer = asString(pick(o, ['answerText'])).trim();
  const diagnosis = asString(pick(o, ['diagnosis'])).trim();
  const suggestedDiagnosis = asString(pick(o, ['suggestedDiagnosis', 'suggested_diagnosis'])).trim();
  const keyFindings = asStringArray(pick(o, ['keyFindings', 'key_findings']));
  const keyImagingFindings = asString(pick(o, ['keyImagingFindings', 'key_imaging_findings'])).trim();
  const findings = asStringArray(pick(o, ['findings']));
  const differentialDiagnoses = asStringArray(pick(o, ['differentialDiagnoses']));
  const reflectiveQuestions = asStringArray(pick(o, ['reflectiveQuestions']));

  let citations: VisualQaCitation[] = [];
  const cit = pick(o, ['citations']);
  if (Array.isArray(cit)) {
    citations = cit.map((c) => {
      if (!c || typeof c !== 'object') return {};
      const cc = c as Record<string, unknown>;
      return {
        kind:
          (() => {
            const rawKind = asNullableString(cc.kind)?.toLowerCase();
            if (!rawKind) return undefined;
            if (rawKind === 'document') return 'doc';
            return rawKind;
          })(),
        documentUrl: asNullableString(cc.documentUrl) ?? undefined,
        chunkOrder: asNullableNumber(cc.chunkOrder ?? cc.chunk_order),
        pageNumber: asNullableNumber(cc.pageNumber ?? cc.page_number),
        startPage: asNullableNumber(cc.startPage ?? cc.start_page),
        endPage: asNullableNumber(cc.endPage ?? cc.end_page),
        title: asNullableString(cc.title) ?? undefined,
        label: asNullableString(cc.label) ?? undefined,
        displayLabel: asNullableString(cc.displayLabel ?? cc.display_label) ?? undefined,
        snippet: asNullableString(cc.snippet) ?? undefined,
        pageLabel: asNullableString(cc.pageLabel ?? cc.page_label) ?? undefined,
        href: asNullableString(cc.href) ?? undefined,
        documentId: asNullableString(cc.documentId ?? cc.document_id) ?? undefined,
        caseId: asNullableString(cc.caseId ?? cc.case_id) ?? undefined,
        version: asNullableString(cc.version) ?? undefined,
      };
    });
  }

  const confRaw = pick(o, ['aiConfidenceScore']);
  let aiConfidenceScore: number | undefined;
  if (typeof confRaw === 'number' && Number.isFinite(confRaw)) {
    aiConfidenceScore = confRaw;
  } else if (typeof confRaw === 'string' && confRaw.trim()) {
    const n = parseFloat(confRaw);
    if (Number.isFinite(n)) aiConfidenceScore = n;
  }

  return {
    ...(questionText ? { questionText } : {}),
    ...(answer ? { answerText: answer } : {}),
    ...(suggestedDiagnosis ? { suggestedDiagnosis } : {}),
    keyFindings,
    ...(keyImagingFindings ? { keyImagingFindings } : {}),
    ...(diagnosis ? { diagnosis } : {}),
    ...(findings.length > 0 ? { findings } : {}),
    ...(reflectiveQuestions.length > 0 ? { reflectiveQuestions } : {}),
    differentialDiagnoses,
    citations,
    ...(aiConfidenceScore !== undefined ? { aiConfidenceScore } : {}),
    responseKind: asNullableString(pick(o, ['responseKind', 'response_kind'])),
    clientRequestId: asNullableString(pick(o, ['clientRequestId', 'client_request_id'])),
    policyReason: asNullableString(pick(o, ['policyReason', 'policy_reason'])),
    systemNoticeCode: asNullableString(pick(o, ['systemNoticeCode', 'system_notice_code'])),
  };
}

function normalizeVisualQaTurn(raw: unknown, fallbackIndex: number): VisualQaTurn {
  const report = normalizeVisualQaReport(raw);
  const o = normalizeRootPayload(raw);
  const turnRaw = pick(o, ['turnIndex']);
  const createdRaw = pick(o, ['createdAt']);
  const roiRaw = pick(o, ['roiBoundingBox']);
  const turnIndex =
    typeof turnRaw === 'number' && Number.isFinite(turnRaw)
      ? turnRaw
      : typeof turnRaw === 'string' && turnRaw.trim()
        ? Number.parseInt(turnRaw, 10) || fallbackIndex
        : fallbackIndex;
  const messagesRaw = pick(o, ['messages', 'Messages']);
  const messages = Array.isArray(messagesRaw)
    ? messagesRaw
        .map((row): VisualQaMessage | null => normalizeVisualQaMessage(row))
        .filter((message): message is VisualQaMessage => message !== null)
    : [];
  const reflectiveTurn = reflectiveQuestionsReportToTurnArray(report.reflectiveQuestions);
  return {
    turnId: asNullableString(pick(o, ['turnId', 'turn_id'])),
    turnIndex,
    ...(report.questionText ? { questionText: report.questionText } : {}),
    ...(report.answerText ? { answerText: report.answerText } : {}),
    ...(messages.length > 0 ? { messages } : {}),
    roiBoundingBox: parseNormalizedBoundingBox(roiRaw),
    diagnosis: report.diagnosis ?? '',
    ...(report.findings ? { findings: report.findings } : {}),
    ...(reflectiveTurn && reflectiveTurn.length > 0 ? { reflectiveQuestions: reflectiveTurn } : {}),
    differentialDiagnoses: report.differentialDiagnoses,
    citations: report.citations,
    aiConfidenceScore: report.aiConfidenceScore,
    createdAt: typeof createdRaw === 'string' ? createdRaw : null,
    responseKind: report.responseKind ?? asNullableString(pick(o, ['responseKind', 'response_kind'])),
    clientRequestId:
      report.clientRequestId ?? asNullableString(pick(o, ['clientRequestId', 'client_request_id'])),
    userMessageId: asNullableString(pick(o, ['userMessageId', 'user_message_id'])),
    assistantMessageId: asNullableString(
      pick(o, ['assistantMessageId', 'assistant_message_id', 'messageId', 'message_id']),
    ),
    reviewState: asNullableString(pick(o, ['reviewState', 'review_state'])),
    lastResponderRole: asNullableString(pick(o, ['lastResponderRole', 'last_responder_role'])),
    actorRole: asNullableString(pick(o, ['actorRole', 'actor_role'])),
    isReviewTarget:
      typeof pick(o, ['isReviewTarget', 'is_review_target']) === 'boolean'
        ? Boolean(pick(o, ['isReviewTarget', 'is_review_target']))
        : undefined,
    policyReason: report.policyReason ?? asNullableString(pick(o, ['policyReason', 'policy_reason'])),
    systemNoticeCode:
      report.systemNoticeCode ?? asNullableString(pick(o, ['systemNoticeCode', 'system_notice_code'])),
  };
}

export function normalizeVisualQaSessionReport(raw: unknown): VisualQaSessionReport {
  const o = normalizeRootPayload(raw);
  const sessionId = asString(pick(o, ['sessionId'])).trim();
  const caseId = asString(pick(o, ['caseId'])).trim() || null;
  const imageId = asString(pick(o, ['imageId'])).trim() || null;
  const status = asString(pick(o, ['status'])).trim() || null;
  const updatedAtRaw = pick(o, ['updatedAt']);
  const updatedAt = typeof updatedAtRaw === 'string' ? updatedAtRaw : null;
  const sessionMessagesRaw = pick(o, ['messages']);
  const messages = Array.isArray(sessionMessagesRaw)
    ? sessionMessagesRaw
        .map((row): VisualQaMessage | null => normalizeVisualQaMessage(row))
        .filter((message): message is VisualQaMessage => message !== null)
    : [];
  const turnsRaw = pick(o, ['turns']);
  const turns = Array.isArray(turnsRaw)
    ? turnsRaw.map((row, idx) => normalizeVisualQaTurn(row, idx + 1))
    : [];
  const latestTurnRaw = pick(o, ['latestTurn', 'latest_turn', 'latest']);
  const latestFromPayload =
    latestTurnRaw && typeof latestTurnRaw === 'object'
      ? normalizeVisualQaTurn(latestTurnRaw, turns[turns.length - 1]?.turnIndex ?? turns.length + 1)
      : null;
  const capabilitiesRaw = pick(o, ['capabilities']);
  const capabilities =
    capabilitiesRaw && typeof capabilitiesRaw === 'object'
      ? {
          canAskNext:
            typeof (capabilitiesRaw as { canAskNext?: unknown }).canAskNext === 'boolean'
              ? (capabilitiesRaw as { canAskNext?: boolean }).canAskNext
              : undefined,
          canRequestReview:
            typeof (capabilitiesRaw as { canRequestReview?: unknown }).canRequestReview === 'boolean'
              ? (capabilitiesRaw as { canRequestReview?: boolean }).canRequestReview
              : undefined,
          isReadOnly:
            typeof (capabilitiesRaw as { isReadOnly?: unknown }).isReadOnly === 'boolean'
              ? (capabilitiesRaw as { isReadOnly?: boolean }).isReadOnly
              : undefined,
          turnsUsed:
            typeof (capabilitiesRaw as { turnsUsed?: unknown }).turnsUsed === 'number'
              ? (capabilitiesRaw as { turnsUsed?: number }).turnsUsed
              : undefined,
          turnLimit:
            typeof (capabilitiesRaw as { turnLimit?: unknown }).turnLimit === 'number'
              ? (capabilitiesRaw as { turnLimit?: number }).turnLimit
              : undefined,
          reason: asString((capabilitiesRaw as { reason?: unknown }).reason).trim() || null,
        }
      : undefined;
  const latest = latestFromPayload ?? (turns.length > 0 ? turns[turns.length - 1] : null);
  const systemNoticeRaw = pick(o, ['systemNotice', 'system_notice']);
  const systemNotice =
    typeof systemNoticeRaw === 'string'
      ? asNullableString(systemNoticeRaw)
      : systemNoticeRaw && typeof systemNoticeRaw === 'object'
        ? asNullableString(
            pick(systemNoticeRaw as Record<string, unknown>, ['message', 'content', 'text', 'notice']),
          )
        : null;
  const systemNoticePolicyReason =
    systemNoticeRaw && typeof systemNoticeRaw === 'object'
      ? asNullableString(pick(systemNoticeRaw as Record<string, unknown>, ['policyReason', 'policy_reason']))
      : null;
  const systemNoticeCode =
    systemNoticeRaw && typeof systemNoticeRaw === 'object'
      ? asNullableString(pick(systemNoticeRaw as Record<string, unknown>, ['systemNoticeCode', 'system_notice_code', 'code']))
      : null;
  const topLevelReport = normalizeVisualQaReport(o);
  const sessionReflective = reflectiveQuestionsReportToTurnArray(topLevelReport.reflectiveQuestions);
  return {
    sessionId: sessionId || 'session-local',
    clientRequestId: asNullableString(pick(o, ['clientRequestId', 'client_request_id'])),
    responseKind: asNullableString(pick(o, ['responseKind', 'response_kind'])),
    ...(topLevelReport.answerText ? { answerText: topLevelReport.answerText } : {}),
    ...(topLevelReport.diagnosis ? { diagnosis: topLevelReport.diagnosis } : {}),
    ...(topLevelReport.findings && topLevelReport.findings.length > 0
      ? { findings: topLevelReport.findings }
      : {}),
    ...(topLevelReport.differentialDiagnoses.length > 0
      ? { differentialDiagnoses: topLevelReport.differentialDiagnoses }
      : {}),
    ...(sessionReflective && sessionReflective.length > 0 ? { reflectiveQuestions: sessionReflective } : {}),
    ...(topLevelReport.citations.length > 0 ? { citations: topLevelReport.citations } : {}),
    caseId,
    imageId,
    status,
    updatedAt,
    reviewState: asNullableString(pick(o, ['reviewState', 'review_state'])),
    lastResponderRole: asNullableString(pick(o, ['lastResponderRole', 'last_responder_role'])),
    systemNotice,
    policyReason: asNullableString(pick(o, ['policyReason', 'policy_reason'])) ?? systemNoticePolicyReason,
    systemNoticeCode:
      asNullableString(pick(o, ['systemNoticeCode', 'system_notice_code'])) ?? systemNoticeCode,
    ...(capabilities ? { capabilities } : {}),
    ...(messages.length > 0 ? { messages } : {}),
    turns,
    latest,
  };
}
