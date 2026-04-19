'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import type { VisualQaCitation } from '@/lib/api/types';
import { buildVisualQaReferences } from '@/lib/utils/visual-qa-references';
import { AlertTriangle, BookOpen, FileText, SearchCheck, Stethoscope, TriangleAlert } from 'lucide-react';

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
    <div className={`${className} break-words [&_a]:break-all [&_pre]:overflow-x-auto`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...markdownExternalLinkComponents,
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        }}
      >
        {cleanMarkdown.trim() || '—'}
      </ReactMarkdown>

      {references.length > 0 ? (
        <div className="mt-3 rounded-xl border border-cyan-500/40 bg-cyan-50 px-3 py-2.5 shadow-sm">
          <p className="text-contrast-outline-soft mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-950">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            References
          </p>
          <ul className="flex flex-col gap-2">
            {references.map((r) => (
              <li key={r.key}>
                {r.kind === 'case' && r.href ? (
                  <Link
                    href={r.href}
                    className="text-contrast-outline-soft inline-flex items-center gap-2 rounded-lg border border-emerald-500/45 bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-950 transition-colors hover:bg-emerald-200"
                  >
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                  </Link>
                ) : r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-contrast-outline-soft inline-flex items-center gap-2 rounded-lg border border-sky-500/45 bg-sky-100 px-2.5 py-1.5 text-xs font-medium text-sky-950 transition-colors hover:bg-sky-200"
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
                      <div className="rounded-lg border border-amber-500/45 bg-amber-100 px-2.5 py-2 text-xs text-amber-950 shadow-sm">
                        <p className="text-contrast-outline-soft flex items-center gap-1.5 font-medium text-amber-950">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          This reference belongs to a legacy version.
                        </p>
                        {r.latestHref ? (
                          <a
                            href={r.latestHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-contrast-outline-soft mt-1 inline-flex rounded-md border border-amber-500/45 bg-amber-200 px-2 py-1 font-medium text-amber-950 transition-colors hover:bg-amber-300"
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
  markdown?: string;
  diagnosis?: string | null;
  findings?: string[];
  differentialDiagnoses?: string[];
  reflectiveQuestions?: string[];
  citations?: VisualQaCitation[];
};

type StructuredReferenceRow = {
  label: string;
  href?: string;
  snippet?: string;
};

function withPageAnchor(url: string, startPage?: number): string {
  if (!url || !startPage || !Number.isFinite(startPage) || startPage <= 0) return url;
  const baseUrl = url.replace(/#.*$/, '');
  return `${baseUrl}#page=${Math.floor(startPage)}`;
}

function formatReferenceRows(citations: VisualQaCitation[]): StructuredReferenceRow[] {
  if (!citations.length) return [];
  const displayReady = citations
    .map((citation): StructuredReferenceRow | null => {
      const displayLabel = citation.displayLabel?.trim();
      const fallbackLabel = citation.label?.trim();
      const label = displayLabel || fallbackLabel;
      if (!label) return null;
      const pageLabel = citation.pageLabel?.trim();
      const shouldAppendPage =
        !displayLabel &&
        Boolean(pageLabel) &&
        !label.toLowerCase().includes(pageLabel!.toLowerCase());
      return {
        label: shouldAppendPage ? `${label} - ${pageLabel}` : label,
        href: citation.href?.trim() || withPageAnchor(citation.documentUrl?.trim() || '', citation.startPage),
        snippet: citation.snippet?.trim() || undefined,
      };
    })
    .filter((row): row is StructuredReferenceRow => row !== null);
  if (displayReady.length > 0) return displayReady;
  const grouped = new Map<string, { pages: number[]; href?: string; startPage?: number }>();
  citations.forEach((c, idx) => {
    const key = (c.documentId?.trim() || c.documentUrl?.trim() || `ref-${idx}`).toLowerCase();
    const parsedStartPage =
      typeof c.startPage === 'number' && Number.isFinite(c.startPage) && c.startPage > 0
        ? c.startPage
        : typeof c.pageNumber === 'number' && Number.isFinite(c.pageNumber) && c.pageNumber > 0
          ? c.pageNumber
          : undefined;
    const row = grouped.get(key) ?? {
      pages: [],
      href: c.documentUrl?.trim() || undefined,
      startPage: parsedStartPage,
    };
    if (parsedStartPage != null) row.pages.push(parsedStartPage);
    if (!row.href && c.documentUrl?.trim()) row.href = c.documentUrl.trim();
    if (!row.startPage && parsedStartPage) row.startPage = parsedStartPage;
    grouped.set(key, row);
  });
  return Array.from(grouped.values()).map(({ pages, href, startPage }, index) => {
    const refNo = index + 1;
    const normalizedHref = href ? withPageAnchor(href, startPage) : undefined;
    if (!pages.length) {
      return {
        label: `Reference [${refNo}]`,
        href: normalizedHref,
      };
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    return {
      label: `Reference [${refNo}] - Page ${start}${end !== start ? `-${end}` : ''}`,
      href: normalizedHref,
    };
  });
}

export function VisualQaStructuredAnswer({
  markdown,
  diagnosis,
  findings = [],
  differentialDiagnoses = [],
  reflectiveQuestions = [],
  citations = [],
}: StructuredAnswerProps) {
  const refs = formatReferenceRows(citations);

  return (
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Stethoscope className="h-3.5 w-3.5 text-primary" aria-hidden />
          Diagnosis
        </p>
        <p className="mt-1 font-semibold text-slate-950">{diagnosis?.trim() || 'No diagnosis provided.'}</p>
      </div>
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SearchCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
          Findings
        </p>
        {findings.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {findings.map((f, idx) => (
              <li key={`${f}-${idx}`}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not specified.</p>
        )}
      </div>
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TriangleAlert className="h-3.5 w-3.5 text-primary" aria-hidden />
          Differential
        </p>
        {differentialDiagnoses.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {differentialDiagnoses.map((d, idx) => (
              <li key={`${d}-${idx}`}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No differential diagnoses returned.</p>
        )}
      </div>
      {reflectiveQuestions.length > 0 ? (
        <div className="rounded-lg border border-sky-500/45 bg-sky-100 px-3 py-2 text-sm italic text-sky-950 shadow-sm">
          <ul className="list-disc space-y-1 pl-5">
            {reflectiveQuestions.map((q, idx) => (
              <li key={`${q}-${idx}`} className="text-contrast-outline-soft">{q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {markdown?.trim() ? (
        <div className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed text-slate-950 shadow-sm break-words [&_a]:break-all [&_pre]:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...markdownExternalLinkComponents,
              h1: ({ children }) => (
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Stethoscope className="h-4 w-4 text-primary" aria-hidden />
                  {children}
                </p>
              ),
              h2: ({ children }) => (
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TriangleAlert className="h-4 w-4 text-primary" aria-hidden />
                  {children}
                </p>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">References</p>
        {refs.length > 0 ? (
          <ul className="mt-1 list-disc space-y-2 pl-5 text-sm">
            {refs.map((row, idx) => (
              <li key={`${row.label}-${idx}`}>
                {row.href ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => window.open(row.href, '_blank', 'noopener,noreferrer')}
                      className="text-contrast-outline-soft text-left text-primary-800 underline underline-offset-2 hover:text-primary-900"
                    >
                      {row.label}
                    </button>
                    {row.snippet ? (
                      <p className="break-words text-xs leading-relaxed text-muted-foreground">{row.snippet}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span>{row.label}</span>
                    {row.snippet ? (
                      <p className="break-words text-xs leading-relaxed text-muted-foreground">{row.snippet}</p>
                    ) : null}
                  </div>
                )}
              </li>
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
    <div className="mt-3 rounded-xl border border-violet-500/45 bg-violet-100 px-3 py-2.5 shadow-sm">
      <p className="text-contrast-outline-soft mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-950">
        Reflective Questions
      </p>
      <div className="text-sm leading-relaxed text-slate-950">
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
