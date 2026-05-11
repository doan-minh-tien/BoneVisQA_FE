import type { Components } from 'react-markdown';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';

/** Shared heading/body styling for assistant markdown in Visual QA (bold dark slate). */
export const visualQaMdHeadingsBold: Pick<Components, 'h1' | 'h2' | 'h3' | 'strong'> = {
  h1: ({ children }) => (
    <h1 className="mb-2 text-base font-bold leading-snug text-slate-900">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-base font-bold leading-snug text-slate-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-sm font-bold leading-snug text-slate-900">{children}</h3>
  ),
  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
};

export function buildAssistantMarkdownComponents(pClass: string): Components {
  return {
    ...markdownExternalLinkComponents,
    ...visualQaMdHeadingsBold,
    p: ({ children }) => <p className={pClass}>{children}</p>,
  };
}
