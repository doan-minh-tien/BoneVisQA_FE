'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import { cn } from '@/lib/utils';
import { VISUAL_QA_MESSAGE_IN } from '@/components/student/visualQaMessageClasses';

type StudentMessageBubbleProps = {
  content: string;
  status?: 'sending' | 'sent' | 'failed';
  className?: string;
};

export function StudentMessageBubble({ content, status, className }: StudentMessageBubbleProps) {
  const showStatusLine = status !== undefined;

  return (
    <div className={cn('flex justify-end', className)}>
      <div
        className={cn(
          VISUAL_QA_MESSAGE_IN,
          'max-w-[min(92vw,92%)] overflow-hidden break-words rounded-2xl border border-[#003ebd] bg-[#0055ff] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm sm:max-w-[92%]',
        )}
      >
        {showStatusLine ? (
          <p className="text-contrast-outline mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {status === 'failed' ? 'Failed' : status === 'sent' ? 'Sent' : 'Sending'}
          </p>
        ) : null}
        {showStatusLine ? (
          <div className="text-contrast-outline">{content}</div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...markdownExternalLinkComponents,
              p: ({ children }) => (
                <p className="text-contrast-outline mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
