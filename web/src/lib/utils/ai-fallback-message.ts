/**
 * Detects generic “service unavailable” style answers from the AI (Vietnamese/English).
 * Used to surface a calmer UI when RAG/LLM returns an apology instead of clinical content.
 */
export function looksLikeAiFallbackAnswer(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.trim().toLowerCase();
  if (t.includes('xin lỗi')) return true;
  if (t.includes('không thể') && (t.includes('xử lý') || t.includes('trả lời'))) return true;
  if (t.includes('tạm thời không') || t.includes('hiện tại không')) return true;
  if (t.includes('sorry') && (t.includes('unable') || t.includes("can't") || t.includes('cannot'))) return true;
  if (t.includes('temporarily unavailable')) return true;
  return false;
}
