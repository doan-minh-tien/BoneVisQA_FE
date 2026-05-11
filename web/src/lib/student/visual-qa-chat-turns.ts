import type { VisualQaTurn } from '@/lib/api/types';

/** Stable identity for de-duping / merging turns (server id → client request id → turn index). */
export function turnIdentity(turn: VisualQaTurn): string {
  if (turn.turnId?.trim()) return `turn:${turn.turnId.trim()}`;
  if (turn.clientRequestId?.trim()) return `request:${turn.clientRequestId.trim()}`;
  if (typeof turn.turnIndex === 'number' && Number.isFinite(turn.turnIndex)) return `index:${turn.turnIndex}`;
  return `fallback:${turn.createdAt ?? ''}:${turn.answerText ?? ''}`;
}

/** Later rows with the same identity replace earlier ones; result sorted by turnIndex. */
export function mergeTurnsByIdentity(base: VisualQaTurn[], incoming: VisualQaTurn[]): VisualQaTurn[] {
  const merged = [...base];
  const identityToIndex = new Map<string, number>();
  merged.forEach((turn, idx) => identityToIndex.set(turnIdentity(turn), idx));
  incoming.forEach((turn) => {
    const key = turnIdentity(turn);
    const existingIndex = identityToIndex.get(key);
    if (typeof existingIndex === 'number') {
      merged[existingIndex] = turn;
      return;
    }
    merged.push(turn);
    identityToIndex.set(key, merged.length - 1);
  });
  return merged.sort((a, b) => {
    if (a.turnIndex !== b.turnIndex) return a.turnIndex - b.turnIndex;
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}

/** Remove a client-only optimistic row (matched by clientRequestId + awaitingAssistant). */
export function removeOptimisticTurnByClientRequestId(turns: VisualQaTurn[], clientRequestId: string): VisualQaTurn[] {
  const id = clientRequestId.trim();
  return turns.filter((t) => !(t.clientRequestId === id && t.awaitingAssistant === true));
}

/**
 * Optimistic Visual QA turn: student question is visible immediately; assistant side waits for BE.
 * Replaced automatically when merge brings a server turn with the same `clientRequestId`.
 */
function turnRichnessScore(t: VisualQaTurn): number {
  let s = 0;
  if (t.turnId?.trim()) s += 10_000;
  if (!t.awaitingAssistant) s += 1_000;
  const body = `${t.answerText ?? ''}${t.diagnosis ?? ''}`.trim();
  s += Math.min(body.length, 50_000);
  return s;
}

/**
 * BE đôi khi trả về cùng một `turnIndex` hai lần: hàng optimistic (`request:…`) và hàng server (`turn:…`)
 * không trùng identity → merge không gộp được. Giữ một dòng (ưu tiên bản có turnId / đã có trả lời).
 */
export function dedupeTurnsSameIndexPreferServer(turns: VisualQaTurn[]): VisualQaTurn[] {
  const byIdx = new Map<number, VisualQaTurn[]>();
  for (const t of turns) {
    const list = byIdx.get(t.turnIndex) ?? [];
    list.push(t);
    byIdx.set(t.turnIndex, list);
  }
  const out: VisualQaTurn[] = [];
  for (const idx of [...byIdx.keys()].sort((a, b) => a - b)) {
    const group = byIdx.get(idx)!;
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const best = [...group].sort((a, b) => turnRichnessScore(b) - turnRichnessScore(a))[0];
    out.push(best);
  }
  return out;
}

export function appendOptimisticQuestionTurn(
  base: VisualQaTurn[],
  question: string,
  clientRequestId: string,
): VisualQaTurn[] {
  const nextIndex = (base[base.length - 1]?.turnIndex ?? 0) + 1;
  const optimistic: VisualQaTurn = {
    turnIndex: nextIndex,
    turnId: null,
    questionText: question,
    clientRequestId,
    awaitingAssistant: true,
    answerText: '',
    diagnosis: '',
    findings: [],
    reflectiveQuestions: [],
    differentialDiagnoses: [],
    citations: [],
    createdAt: new Date().toISOString(),
    responseKind: 'analysis',
    actorRole: 'assistant',
    lastResponderRole: 'assistant',
    isReviewTarget: true,
  };
  return mergeTurnsByIdentity(base, [optimistic]);
}
