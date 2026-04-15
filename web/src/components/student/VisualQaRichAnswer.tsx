'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import type { VisualQaCitation } from '@/lib/api/types';
import { buildVisualQaReferences } from '@/lib/utils/visual-qa-references';
import { AlertTriangle, BookOpen, FileText, Stethoscope } from 'lucide-react';

type Props = {
  markdown: string;
  citations: VisualQaCitation[];
  className?: string;
};

export function VisualQaRichAnswer({ markdown, citations, className = '' }: Props) {
  const { cleanMarkdown, references } = useMemo(
    () => buildVisualQaReferences(markdown, citations),
    [markdown, citations],
  );

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...markdownExternalLinkComponents,
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        }}
      >
        {cleanMarkdown.trim() || '_—_'}
      </ReactMarkdown>

      {references.length > 0 ? (
        <div className="mt-3 rounded-xl border border-cyan-accent/25 bg-cyan-accent/5 px-3 py-2.5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            References
          </p>
          <ul className="flex flex-col gap-2">
            {references.map((r) => (
              <li key={r.key}>
                {r.kind === 'case' && r.href ? (
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-500/20"
                  >
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                  </Link>
                ) : r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-900 transition-colors hover:bg-sky-500/15"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                    <span className="text-[10px] font-normal text-muted-foreground">(PDF)</span>
                  </a>
                ) : (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {r.label}
                      <span className="text-[10px]">—</span>
                    </span>
                    {r.kind === 'doc' && r.isLegacyUnavailable ? (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs">
                        <p className="flex items-center gap-1.5 font-medium text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          This reference belongs to a legacy version.
                        </p>
                        {r.latestHref ? (
                          <a
                            href={r.latestHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-500/25"
                          >
                            View latest document
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type StructuredAnswerProps = {
  suggestedDiagnosis?: string | null;
  differentialDiagnoses?: string[];
  keyFindings?: string[];
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  citations?: VisualQaCitation[];
};

function formatReferenceRows(citations: VisualQaCitation[]): string[] {
  if (!citations.length) return [];
  const grouped = new Map<string, { title: string; pages: number[] }>();
  citations.forEach((c, idx) => {
    const key = (c.documentId?.trim() || c.documentUrl?.trim() || `ref-${idx}`).toLowerCase();
    const title = c.title?.trim() || `Reference ${idx + 1}`;
    const chunk = typeof c.chunkOrder === 'number' && Number.isFinite(c.chunkOrder) ? c.chunkOrder : null;
    const row = grouped.get(key) ?? { title, pages: [] };
    if (chunk != null) row.pages.push(chunk);
    grouped.set(key, row);
  });
  return Array.from(grouped.values()).map(({ title, pages }) => {
    if (!pages.length) return `${title}`;
    const sorted = [...pages].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    return `${title} - Page ${start}${end !== start ? `-${end}` : ''}`;
  });
}

export function VisualQaStructuredAnswer({
  suggestedDiagnosis,
  differentialDiagnoses = [],
  keyFindings = [],
  keyImagingFindings,
  reflectiveQuestions,
  citations = [],
}: StructuredAnswerProps) {
  const refs = formatReferenceRows(citations);
  const normalizedFindings =
    keyFindings.length > 0
      ? keyFindings
      : keyImagingFindings
        ? keyImagingFindings
            .split(/\n|;/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested Diagnosis</p>
        <p className="mt-1 font-semibold text-foreground">{suggestedDiagnosis?.trim() || 'No diagnosis provided.'}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Differential Diagnoses</p>
        {differentialDiagnoses.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {differentialDiagnoses.map((d, idx) => (
              <li key={`${d}-${idx}`}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not specified.</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Imaging Signs</p>
        {normalizedFindings.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {normalizedFindings.map((f, idx) => (
              <li key={`${f}-${idx}`}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not specified.</p>
        )}
      </div>
      {reflectiveQuestions?.trim() ? (
        <div className="rounded-lg border border-violet-300/40 bg-violet-50 px-3 py-2 text-sm italic text-violet-900">
          {reflectiveQuestions}
        </div>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">References</p>
        {refs.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {refs.map((row, idx) => (
              <li key={`${row}-${idx}`}>{row}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No references returned.</p>
        )}
      </div>
    </div>
  );
}

/** Prominent reflective prompts at the end of an assistant turn (per curriculum specs). */
export function VisualQaReflectiveQuestions({ text }: { text: string }) {
  const body = text.trim();
  if (!body) return null;
  return (
    <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-50/95 px-3 py-2.5 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-800">
        Reflective Questions
      </p>
      <div className="text-sm leading-relaxed text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            ...markdownExternalLinkComponents,
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
