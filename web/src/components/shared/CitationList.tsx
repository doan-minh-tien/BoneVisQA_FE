import type { VisualQaCitation } from '@/lib/api/types';

const FALLBACK =
  'No specific literature cited for this deductive reasoning.';

type CitationListProps = {
  citations: VisualQaCitation[];
  /** When true, render nothing if there are no citations (legacy behavior). */
  hideWhenEmpty?: boolean;
};

export function CitationList({ citations, hideWhenEmpty }: CitationListProps) {
  const visibleCitations = citations.filter((citation) => {
    return Boolean(
      (citation.documentUrl && citation.documentUrl.trim()) ||
        (citation.title && citation.title.trim()),
    );
  });

  if (visibleCitations.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Citations / Knowledge base
        </h3>
        <div className="rounded-xl border border-border-color bg-surface/80 px-5 py-4 text-sm italic text-text-muted">
          {FALLBACK}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
        Citations / Knowledge base
      </h3>
      <ul className="space-y-3 rounded-xl border border-border-color bg-surface p-5 text-sm">
        {visibleCitations.map((citation, index) => {
          const url = citation.documentUrl?.trim() || '';
          const label =
            citation.title?.trim() ||
            `Reference ${index + 1}${citation.chunkOrder != null ? ` · excerpt ${citation.chunkOrder}` : ''}`;

          return (
            <li key={`${url}-${index}`} className="rounded-lg border border-border-color bg-background/45 px-4 py-3">
              {url ? (
                <>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cyan-accent underline decoration-cyan-accent/50 underline-offset-4 hover:text-cyan-accent/80"
                  >
                    {label}
                  </a>
                  <p className="mt-1 break-all text-xs text-text-muted">{url}</p>
                </>
              ) : (
                <span className="inline-flex rounded-full border border-border-color bg-surface px-3 py-1 text-xs font-medium text-text-main">
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
