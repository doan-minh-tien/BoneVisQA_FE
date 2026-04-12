/** Split SEPS prose or newline/semicolon-separated imaging findings into bullet lines. */
export function splitLearningBullets(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}
