/**
 * Detects generic “service unavailable” style answers from the AI.
 * Used to surface a calmer UI when RAG/LLM returns an apology instead of clinical content.
 */
export function looksLikeAiFallbackAnswer(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.trim().toLowerCase();
  if (t.includes('sorry') && (t.includes('unable') || t.includes("can't") || t.includes('cannot'))) return true;
  if (t.includes('temporarily unavailable')) return true;
  return false;
}
