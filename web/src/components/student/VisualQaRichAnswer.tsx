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
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Nguồn tham khảo
          </p>
          <ul className="flex flex-col gap-2">
            {references.map((r) => (
              <li key={r.key}>
                {r.kind === 'case' && r.href ? (
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-500/20 dark:text-emerald-100"
                  >
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.label}
                  </Link>
                ) : r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-900 transition-colors hover:bg-sky-500/15 dark:text-sky-100"
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
                        <p className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Nguồn tham khảo này thuộc phiên bản cũ.
                        </p>
                        {r.latestHref ? (
                          <a
                            href={r.latestHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-500/25 dark:text-amber-100"
                          >
                            Xem tài liệu mới nhất
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

/** Prominent reflective prompts at the end of an assistant turn (per curriculum specs). */
export function VisualQaReflectiveQuestions({ text }: { text: string }) {
  const body = text.trim();
  if (!body) return null;
  return (
    <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-50/95 px-3 py-2.5 shadow-sm dark:border-violet-500/35 dark:bg-violet-950/50">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-800 dark:text-violet-200">
        Câu hỏi gợi ý (Reflective)
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
