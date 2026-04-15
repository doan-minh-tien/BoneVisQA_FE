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

function normalizeVisualQaMessage(raw: unknown): VisualQaMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const role = asString(pick(m, ['role', 'Role'])).trim();
  const content = asString(pick(m, ['content', 'Content', 'message', 'Message'])).trim();
  if (!content) return null;
  const createdAtRaw = pick(m, ['createdAt', 'CreatedAt']);
  return {
    role: role || 'Assistant',
    content,
    createdAt: typeof createdAtRaw === 'string' ? createdAtRaw : null,
  };
}

export function normalizeVisualQaReport(raw: unknown): VisualQaReport {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const questionText = asString(
    pick(o, ['questionText', 'QuestionText', 'studentQuestion', 'originalQuestion']),
  ).trim();

  const answer = asString(pick(o, ['answerText', 'answer', 'explanation', 'content'])) || '';

  const suggested = asString(pick(o, ['suggestedDiagnosis', 'diagnosis']));

  let keyFindings = asStringArray(pick(o, ['keyFindings']));
  if (keyFindings.length === 0) {
    const single = pick(o, ['keyFindingsText']);
    if (typeof single === 'string' && single.trim()) {
      keyFindings = single
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  let diff = asStringArray(pick(o, ['differentialDiagnoses']));
  if (diff.length === 0) {
    const d = pick(o, ['differentialDiagnosis']);
    if (typeof d === 'string' && d) diff = [d];
  }

  let readings: VisualQaReport['recommendedReadings'] = [];
  const rr = pick(o, ['recommendedReadings']);
  if (Array.isArray(rr)) {
    readings = rr.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const r = item as Record<string, unknown>;
        return {
          title: asString(r.title ?? r.linkText),
          url: asString(r.url ?? r.link),
        };
      }
      return String(item);
    });
  }

  let citations: VisualQaCitation[] = [];
  const cit = pick(o, ['citations']);
  if (Array.isArray(cit)) {
    citations = cit.map((c) => {
      if (!c || typeof c !== 'object') return {};
      const cc = c as Record<string, unknown>;
      const chunkRaw = cc.chunkOrder ?? cc.chunk_order;
      let chunkOrder: number | undefined;
      if (typeof chunkRaw === 'number' && Number.isFinite(chunkRaw)) chunkOrder = chunkRaw;
      else if (typeof chunkRaw === 'string' && chunkRaw.trim()) {
        const n = parseInt(chunkRaw, 10);
        if (Number.isFinite(n)) chunkOrder = n;
      }
      return {
        documentUrl: asString(cc.documentUrl ?? cc.referenceUrl ?? cc.documentURL),
        chunkOrder,
        title: asString(cc.title),
        documentId: asString(cc.documentId ?? cc.DocumentId ?? cc.document_id),
        caseId: asString(cc.caseId ?? cc.CaseId ?? cc.case_id),
        version: asString(cc.version ?? cc.Version ?? cc.documentVersion ?? cc.document_version),
      };
    });
  }

  const confRaw = pick(o, ['aiConfidenceScore', 'confidenceScore', 'confidence']);
  let aiConfidenceScore: number | undefined;
  if (typeof confRaw === 'number' && Number.isFinite(confRaw)) {
    aiConfidenceScore = confRaw;
  } else if (typeof confRaw === 'string' && confRaw.trim()) {
    const n = parseFloat(confRaw);
    if (Number.isFinite(n)) aiConfidenceScore = n;
  }

  const keyImagingRaw = pick(o, ['keyImagingFindings', 'KeyImagingFindings']);
  const reflectiveRaw = pick(o, ['reflectiveQuestions', 'ReflectiveQuestions']);
  const keyImagingFindings =
    keyImagingRaw === null || keyImagingRaw === undefined
      ? null
      : typeof keyImagingRaw === 'string'
        ? keyImagingRaw.trim() || null
        : String(keyImagingRaw).trim() || null;
  const reflectiveQuestions =
    reflectiveRaw === null || reflectiveRaw === undefined
      ? null
      : typeof reflectiveRaw === 'string'
        ? reflectiveRaw.trim() || null
        : String(reflectiveRaw).trim() || null;

  return {
    ...(questionText ? { questionText } : {}),
    answerText: answer,
    suggestedDiagnosis: suggested,
    keyFindings,
    ...(keyImagingFindings !== null ? { keyImagingFindings } : {}),
    ...(reflectiveQuestions !== null ? { reflectiveQuestions } : {}),
    differentialDiagnoses: diff,
    recommendedReadings: readings,
    citations,
    ...(aiConfidenceScore !== undefined ? { aiConfidenceScore } : {}),
  };
}

function normalizeVisualQaTurn(raw: unknown, fallbackIndex: number): VisualQaTurn {
  const report = normalizeVisualQaReport(raw);
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const turnRaw = pick(o, ['turnIndex', 'TurnIndex', 'index', 'Index']);
  const createdRaw = pick(o, ['createdAt', 'CreatedAt', 'askedAt', 'AskedAt']);
  const roiRaw = pick(o, [
    'roiBoundingBox',
    'RoiBoundingBox',
    'coordinates',
    'Coordinates',
    'customPolygon',
    'CustomPolygon',
  ]);
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
  return {
    turnIndex,
    questionText: report.questionText ?? '',
    answerText: report.answerText,
    ...(messages.length > 0 ? { messages } : {}),
    roiBoundingBox: parseNormalizedBoundingBox(roiRaw),
    suggestedDiagnosis: report.suggestedDiagnosis,
    keyFindings: report.keyFindings,
    keyImagingFindings: report.keyImagingFindings ?? null,
    reflectiveQuestions: report.reflectiveQuestions ?? null,
    differentialDiagnoses: report.differentialDiagnoses,
    recommendedReadings: report.recommendedReadings,
    citations: report.citations,
    aiConfidenceScore: report.aiConfidenceScore,
    createdAt: typeof createdRaw === 'string' ? createdRaw : null,
  };
}

export function normalizeVisualQaSessionReport(raw: unknown): VisualQaSessionReport {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const sessionId = asString(pick(o, ['sessionId', 'SessionId'])).trim();
  const caseId = asString(pick(o, ['caseId', 'CaseId'])).trim() || null;
  const imageId = asString(pick(o, ['imageId', 'ImageId'])).trim() || null;
  const status = asString(pick(o, ['status', 'Status', 'sessionStatus', 'SessionStatus'])).trim() || null;
  const updatedAtRaw = pick(o, ['updatedAt', 'UpdatedAt', 'lastUpdatedAt', 'LastUpdatedAt']);
  const updatedAt = typeof updatedAtRaw === 'string' ? updatedAtRaw : null;
  const sessionMessagesRaw = pick(o, ['messages', 'Messages']);
  const messages = Array.isArray(sessionMessagesRaw)
    ? sessionMessagesRaw
        .map((row): VisualQaMessage | null => normalizeVisualQaMessage(row))
        .filter((message): message is VisualQaMessage => message !== null)
    : [];
  const turnsRaw = pick(o, ['turns', 'Turns', 'history', 'History']);
  const turns = Array.isArray(turnsRaw)
    ? turnsRaw.map((row, idx) => normalizeVisualQaTurn(row, idx + 1))
    : [];
  const fallbackSingle = turns.length === 0 ? normalizeVisualQaTurn(raw, 1) : null;
  const effectiveTurns = turns.length > 0 ? turns : fallbackSingle ? [fallbackSingle] : [];
  const latest = effectiveTurns.length > 0 ? effectiveTurns[effectiveTurns.length - 1] : null;
  return {
    sessionId: sessionId || 'session-local',
    caseId,
    imageId,
    status,
    updatedAt,
    ...(messages.length > 0 ? { messages } : {}),
    turns: effectiveTurns.slice(-3),
    latest,
  };
}
