'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import type { VisualQaCitation } from '@/lib/api/types';
import { resolveApiAssetUrl, withVersionedAssetUrl } from '@/lib/api/client';
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
        <div className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-900">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            References
          </p>
          <ul className="flex flex-col gap-2">
            {references.map((r) => (
              <li key={r.key}>
                {r.kind === 'case' && r.href ? (
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                  >
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                  </Link>
                ) : r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                    <span className="text-[10px] font-normal text-muted-foreground">(PDF)</span>
                  </a>
                ) : (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm">
                      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {r.label}
                      <span className="text-[10px]">—</span>
                    </span>
                    {r.kind === 'doc' && r.isLegacyUnavailable ? (
                      <div className="rounded-lg border border-slate-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-950 shadow-sm">
                        <p className="flex items-center gap-1.5 font-semibold text-amber-950">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          This reference belongs to a legacy version.
                        </p>
                        {r.latestHref ? (
                          <a
                            href={r.latestHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-amber-950 shadow-sm transition-colors hover:bg-slate-50"
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
  /** JSON hoặc plain text từ triage — gộp vào card Diagnosis khi `diagnosis` trống. */
  structuredDiagnosis?: string | null;
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

export function withPageAnchor(url: string, startPage?: number): string {
  if (!url || !startPage || !Number.isFinite(startPage) || startPage <= 0) return url;
  const baseUrl = url.replace(/#.*$/, '');
  return `${baseUrl}#page=${Math.floor(startPage)}`;
}

function parseStructuredDiagnosisPlain(raw?: string | null): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as Record<string, unknown>;
      const d = typeof o.diagnosis === 'string' ? o.diagnosis.trim() : '';
      if (d) return d;
    } catch {
      /* fall through — plain text */
    }
  }
  return t;
}

/** Gộp `diagnosis` với `structuredDiagnosis` (JSON/plain) để card và dedup dùng cùng một nguồn sự thật. */
export function mergeDiagnosisForDisplay(
  diagnosis?: string | null,
  structuredDiagnosis?: string | null,
): string {
  const d = diagnosis?.trim();
  if (d) return d;
  return parseStructuredDiagnosisPlain(structuredDiagnosis)?.trim() ?? '';
}

/**
 * Gỡ khối narrative trùng Diagnosis / Findings / Differential (BE thường nhân đôi cùng đoạn vào `answerText`).
 */
export function dedupeNarrativeAgainstClinicalFields(
  markdown: string | undefined,
  clinicalDiagnosis: string | null | undefined,
  findings: string[] = [],
  differentialDiagnoses: string[] = [],
): string | undefined {
  const md = markdown?.trim();
  if (!md) return undefined;

  const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
  const sm = squash(md);

  const blocks: string[] = [];
  const pushBlock = (s: string | null | undefined) => {
    const t = s?.trim();
    if (t) blocks.push(squash(t));
  };
  pushBlock(clinicalDiagnosis);
  for (const f of findings) pushBlock(String(f));
  for (const d of differentialDiagnoses) pushBlock(String(d));

  for (const b of blocks) {
    if (!b.length) continue;
    if (sm === b) return undefined;
    if (b.length >= 24 && sm.startsWith(b.slice(0, Math.min(b.length, 280)))) return undefined;
  }

  const firstBlock = md.split(/\n\s*\n/)[0]?.trim();
  if (firstBlock) {
    const sf = squash(firstBlock);
    for (const b of blocks) {
      if (!b.length) continue;
      if (sf === b) {
        const rest = md.slice(md.indexOf(firstBlock) + firstBlock.length).trim();
        return rest || undefined;
      }
      if (b.length >= 24 && sf.startsWith(b.slice(0, Math.min(b.length, 280)))) {
        const rest = md.slice(md.indexOf(firstBlock) + firstBlock.length).trim();
        return rest || undefined;
      }
    }
  }

  return md;
}

/** @deprecated Dùng dedupeNarrativeAgainstClinicalFields — giữ export để tránh gãy import ngoài bundle. */
export function narrativeMarkdownDedupAgainstDiagnosis(
  markdown: string | undefined,
  diagnosis?: string | null,
): string | undefined {
  return dedupeNarrativeAgainstClinicalFields(markdown, diagnosis, [], []);
}

export function shouldSuppressLeakedMedicalJsonMarkdown(markdown: string | undefined): boolean {
  const t = markdown?.trim();
  if (!t) return false;
  let s = t;
  if (s.startsWith('```')) {
    s = s
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
  }
  if (!s.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(s) as Record<string, unknown>;
    return (
      typeof parsed.diagnosis === 'string' ||
      Array.isArray(parsed.findings) ||
      Array.isArray(parsed.differential_diagnoses) ||
      Array.isArray(parsed.differentialDiagnoses) ||
      Array.isArray(parsed.reflective_questions) ||
      Array.isArray(parsed.reflectiveQuestions)
    );
  } catch {
    return /\{[\s\S]*"(?:diagnosis|findings|differential_diagnoses)"\s*:/i.test(t);
  }
}

function resolveCitationHref(citation: VisualQaCitation): string | undefined {
  const direct = citation.href?.trim();
  if (direct) return direct;
  const caseId = citation.caseId?.trim();
  if (caseId) return `/student/cases/${caseId}`;
  const raw = citation.documentUrl?.trim();
  if (!raw) return undefined;
  const resolved = resolveApiAssetUrl(raw);
  const versioned = resolved ? withVersionedAssetUrl(resolved, citation.version) : '';
  return withPageAnchor(versioned, citation.startPage ?? citation.pageNumber);
}

function formatReferenceRows(citations: VisualQaCitation[]): StructuredReferenceRow[] {
  if (!citations.length) return [];

  return citations.map((citation, index): StructuredReferenceRow => {
    const snippet = citation.snippet?.trim() || undefined;
    const displayLabel = citation.displayLabel?.trim();
    const fallbackLabel = citation.label?.trim();
    const title = citation.title?.trim();
    const pageLabel = citation.pageLabel?.trim();
    const pageNum =
      typeof citation.pageNumber === 'number' && Number.isFinite(citation.pageNumber) && citation.pageNumber > 0
        ? Math.floor(citation.pageNumber)
        : typeof citation.startPage === 'number' && Number.isFinite(citation.startPage) && citation.startPage > 0
          ? Math.floor(citation.startPage)
          : undefined;

    let label = displayLabel || fallbackLabel || title;
    if (!label && pageLabel) label = pageLabel;
    if (!label && citation.chunkId?.trim()) {
      label = `Chunk ${citation.chunkId.trim().slice(0, 8)}…`;
    }
    if (!label) {
      label =
        typeof pageNum === 'number'
          ? `Reference [${index + 1}] · Page ${pageNum}`
          : `Reference [${index + 1}]`;
    } else if (
      !displayLabel &&
      pageLabel &&
      !label.toLowerCase().includes(pageLabel.toLowerCase())
    ) {
      label = `${label} - ${pageLabel}`;
    } else if (
      !displayLabel &&
      typeof pageNum === 'number' &&
      !/\bpage\b/i.test(label) &&
      !label.includes(String(pageNum))
    ) {
      label = `${label} · p. ${pageNum}`;
    }

    return {
      label,
      href: resolveCitationHref(citation),
      snippet,
    };
  });
}

export function VisualQaStructuredAnswer({
  markdown,
  diagnosis,
  structuredDiagnosis,
  findings = [],
  differentialDiagnoses = [],
  reflectiveQuestions = [],
  citations = [],
}: StructuredAnswerProps) {
  const refs = formatReferenceRows(citations);
  const displayDiagnosis = useMemo(
    () => mergeDiagnosisForDisplay(diagnosis, structuredDiagnosis),
    [diagnosis, structuredDiagnosis],
  );
  const narrativeMarkdown = dedupeNarrativeAgainstClinicalFields(
    markdown,
    displayDiagnosis || null,
    findings,
    differentialDiagnoses,
  );
  const showNarrativeMarkdown =
    Boolean(narrativeMarkdown?.trim()) &&
    !shouldSuppressLeakedMedicalJsonMarkdown(narrativeMarkdown);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-900">
          <Stethoscope className="h-3.5 w-3.5 text-slate-900" aria-hidden />
          Diagnosis
        </p>
        <p className="mt-2 font-semibold leading-relaxed text-slate-900">
          {displayDiagnosis || 'No diagnosis provided.'}
        </p>
      </div>
      <div className="rounded-xl border border-slate-300 bg-white p-3 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-900">
          <SearchCheck className="h-3.5 w-3.5 text-slate-900" aria-hidden />
          Findings
        </p>
        {findings.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm font-medium text-slate-900">
            {findings.map((f, idx) => (
              <li key={`${f}-${idx}`}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-medium text-slate-700">Not specified.</p>
        )}
      </div>
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-900">
          <TriangleAlert className="h-3.5 w-3.5 text-slate-900" aria-hidden />
          Differential
        </p>
        {differentialDiagnoses.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm font-medium text-slate-900">
            {differentialDiagnoses.map((d, idx) => (
              <li key={`${d}-${idx}`}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-medium text-slate-700">No differential diagnoses returned.</p>
        )}
      </div>
      {reflectiveQuestions.length > 0 ? (
        <div className="rounded-xl border border-slate-300 bg-blue-50/80 px-3 py-3 text-sm text-slate-900 shadow-sm">
          <ul className="list-disc space-y-1.5 pl-5 font-medium not-italic">
            {reflectiveQuestions.map((q, idx) => (
              <li key={`${q}-${idx}`}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {showNarrativeMarkdown ? (
        <div className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed text-slate-950 shadow-sm break-words [&_a]:break-all [&_pre]:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...markdownExternalLinkComponents,
              h1: ({ children }) => (
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Stethoscope className="h-4 w-4 text-slate-900" aria-hidden />
                  {children}
                </p>
              ),
              h2: ({ children }) => (
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <TriangleAlert className="h-4 w-4 text-slate-900" aria-hidden />
                  {children}
                </p>
              ),
              h3: ({ children }) => (
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">{children}</p>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-950">{children}</p>,
            }}
          >
            {narrativeMarkdown}
          </ReactMarkdown>
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-900">References</p>
        {refs.length > 0 ? (
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-medium text-slate-900">
            {refs.map((row, idx) => (
              <li key={`${row.label}-${idx}`}>
                {row.href ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => window.open(row.href, '_blank', 'noopener,noreferrer')}
                      className="text-left font-semibold text-blue-900 underline decoration-2 underline-offset-2 hover:text-blue-950"
                    >
                      {row.label}
                    </button>
                    {row.snippet ? (
                      <p className="break-words text-xs leading-relaxed text-slate-800">{row.snippet}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="font-medium">{row.label}</span>
                    {row.snippet ? (
                      <p className="break-words text-xs leading-relaxed text-slate-800">{row.snippet}</p>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-medium text-slate-700">No references returned.</p>
        )}
      </div>
    </div>
  );
}

export function VisualQaReflectiveQuestions({ text }: { text: string }) {
  const body = text.trim();
  if (!body) return null;
  return (
    <div className="mt-3 rounded-xl border border-slate-300 bg-violet-50 px-3 py-2.5 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-900">
        Reflective Questions
      </p>
      <div className="text-sm font-medium leading-relaxed text-slate-900">
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
