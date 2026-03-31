import type { VisualQaCitation, VisualQaReport } from './types';

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

export function normalizeVisualQaReport(raw: unknown): VisualQaReport {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

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
      return {
        documentUrl: asString(cc.documentUrl),
        chunkOrder: typeof cc.chunkOrder === 'number' ? Number(cc.chunkOrder) : undefined,
        title: asString(cc.title),
      };
    });
  }

  return {
    answerText: answer,
    suggestedDiagnosis: suggested,
    keyFindings,
    differentialDiagnoses: diff,
    recommendedReadings: readings,
    citations,
  };
}
