import type { VisualQaCitation } from '@/lib/api/types';

export function CitationList({ citations }: { citations: VisualQaCitation[] }) {
  const visibleCitations = citations.filter((citation) => {
    return Boolean(citation.documentUrl && citation.documentUrl.trim());
  });

  if (visibleCitations.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
        Citations
      </h3>
      <ul className="space-y-3 rounded-xl border border-border-color bg-surface p-5 text-sm">
        {visibleCitations.map((citation, index) => {
          const url = citation.documentUrl!.trim();
          const label =
            citation.title?.trim() ||
            `Reference ${index + 1}${citation.chunkOrder != null ? ` · excerpt ${citation.chunkOrder}` : ''}`;

          return (
            <li key={`${url}-${index}`} className="rounded-lg border border-border-color bg-background/45 px-4 py-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cyan-accent underline decoration-cyan-accent/50 underline-offset-4 hover:text-cyan-accent/80"
              >
                {label}
              </a>
              <p className="mt-1 break-all text-xs text-text-muted">{url}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
