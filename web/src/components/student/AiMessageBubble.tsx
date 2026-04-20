'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, Loader2, MoreHorizontal } from 'lucide-react';
import {
  shouldSuppressLeakedMedicalJsonMarkdown,
  VisualQaStructuredAnswer,
} from '@/components/student/VisualQaRichAnswer';
import type { Components } from 'react-markdown';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import type { VisualQaTurn } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { VISUAL_QA_MESSAGE_IN } from '@/components/student/visualQaMessageClasses';
import {
  buildAssistantMarkdownComponents,
  visualQaMdHeadingsBold,
} from '@/components/student/visualQaMarkdownComponents';

function hasDisplayableAnalysisContent(turn: VisualQaTurn): boolean {
  if (turn.diagnosis?.trim()) return true;
  if (turn.findings?.some((item) => item?.trim())) return true;
  if (turn.differentialDiagnoses?.some((item) => item?.trim())) return true;
  if (turn.reflectiveQuestions?.some((item) => item?.trim())) return true;
  if (turn.structuredDiagnosis?.trim()) return true;
  if (turn.keyImagingFindings?.trim()) return true;
  /** Citations alone must not flip to structured layout — avoid empty Diagnosis + duplicate prose. */
  const md = turn.answerText?.trim();
  if (md && !shouldSuppressLeakedMedicalJsonMarkdown(md)) return true;
  return false;
}

function sanitizeSystemNoticeMarkdownBody(text: string, noticeCode?: string | null): string {
  const t = text.trim();
  if (!t) return '';
  const code = noticeCode?.trim().toUpperCase();
  if (code && t.toUpperCase() === code) return '';
  if (/^[A-Z][A-Z0-9_]+$/.test(t)) return '';
  return text;
}

export type AiResponseKind =
  | 'analysis'
  | 'refusal'
  | 'clarification'
  | 'review_update'
  | 'system_notice';

export type ExpertSupportInline =
  | { kind: 'awaiting' }
  | { kind: 'resolved'; tone: 'success' | 'danger'; text: string };

export type AiMessageBubbleProps = {
  turn: VisualQaTurn;
  assistantText: string;
  responseKind: AiResponseKind;
  awaitingAssistant: boolean;
  chatRequestPhase: 'idle' | 'upload' | 'analyzing';
  systemNoticeLabel: string | null;
  inlineReviewFeedbackMarkdown: string | null;
  canRequestReview: boolean;
  requestingExpertSupport: boolean;
  activeMenuTurnKey: string | null;
  turnMenuKey: string;
  onToggleMenu: () => void;
  onRequestExpertSupport: () => void;
  /** Trạng thái Request Expert — không tạo bubble chat riêng, chỉ dòng dưới answer. */
  expertSupportInline?: ExpertSupportInline | null;
};

export function AiMessageBubble({
  turn,
  assistantText,
  responseKind,
  awaitingAssistant,
  chatRequestPhase,
  systemNoticeLabel,
  inlineReviewFeedbackMarkdown,
  canRequestReview,
  requestingExpertSupport,
  activeMenuTurnKey,
  turnMenuKey,
  onToggleMenu,
  onRequestExpertSupport,
  expertSupportInline = null,
}: AiMessageBubbleProps) {
  const showExpertMenu =
    canRequestReview &&
    expertSupportInline == null &&
    !awaitingAssistant &&
    (turn.actorRole?.trim().toLowerCase() === 'assistant' ||
      turn.isReviewTarget === true ||
      responseKind === 'analysis');

  const safeMarkdownAssistantText = shouldSuppressLeakedMedicalJsonMarkdown(assistantText)
    ? ''
    : assistantText;

  const systemNoticeMarkdownBody =
    responseKind === 'system_notice'
      ? sanitizeSystemNoticeMarkdownBody(safeMarkdownAssistantText, turn.systemNoticeCode?.trim())
      : safeMarkdownAssistantText;

  const mdClarificationRefusal = buildAssistantMarkdownComponents(
    'mb-2 text-slate-950 last:mb-0 leading-relaxed',
  );
  const mdSystemNotice: Components = {
    ...markdownExternalLinkComponents,
    ...visualQaMdHeadingsBold,
    p: ({ children }) => (
      <p className="mb-2 font-medium leading-relaxed text-slate-900 last:mb-0">{children}</p>
    ),
  };
  const mdInlineFeedback = buildAssistantMarkdownComponents(
    'mb-2 font-medium text-emerald-900 last:mb-0 leading-relaxed',
  );
  const mdFallback = buildAssistantMarkdownComponents(
    'mb-2 text-slate-950 last:mb-0 leading-relaxed',
  );

  return (
    <div className="group flex justify-start">
      <div
        className={cn(
          VISUAL_QA_MESSAGE_IN,
          'relative max-w-[min(92vw,92%)] overflow-visible break-words rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-950 shadow-sm [&_a]:break-all [&_pre]:overflow-x-auto sm:max-w-[92%]',
        )}
      >
        {awaitingAssistant ? (
          chatRequestPhase === 'upload' ? (
            <div className="flex items-center gap-2 text-sm text-slate-600" aria-busy>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
              <span>Uploading study image…</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 py-0.5" aria-busy aria-label="Assistant is typing">
              <span className="messenger-typing-dot" />
              <span className="messenger-typing-dot" />
              <span className="messenger-typing-dot" />
            </div>
          )
        ) : responseKind === 'analysis' ? (
          !hasDisplayableAnalysisContent(turn) ? (
            <div className="inline-flex items-center gap-1.5 py-0.5" aria-busy aria-label="Assistant is typing">
              <span className="messenger-typing-dot" />
              <span className="messenger-typing-dot" />
              <span className="messenger-typing-dot" />
            </div>
          ) : (
            <VisualQaStructuredAnswer
              markdown={turn.answerText}
              diagnosis={turn.diagnosis}
              structuredDiagnosis={turn.structuredDiagnosis}
              findings={turn.findings}
              differentialDiagnoses={turn.differentialDiagnoses}
              reflectiveQuestions={turn.reflectiveQuestions}
              citations={turn.citations ?? []}
            />
          )
        ) : responseKind === 'clarification' || responseKind === 'refusal' ? (
          <div className="space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdClarificationRefusal}>
              {safeMarkdownAssistantText || 'The assistant returned a non-analysis response.'}
            </ReactMarkdown>
          </div>
        ) : responseKind === 'system_notice' ? (
          <div className="space-y-2 rounded-xl border border-slate-300 bg-violet-50 px-3 py-3 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-900">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-900" aria-hidden />
              System notice
            </p>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdSystemNotice}>
              {systemNoticeMarkdownBody ||
                (systemNoticeLabel ? '' : 'This session has a new system notice.')}
            </ReactMarkdown>
            {systemNoticeLabel ? (
              <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium leading-relaxed text-slate-900 shadow-sm">
                {systemNoticeLabel}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdFallback}>
              {safeMarkdownAssistantText || 'The assistant returned a response.'}
            </ReactMarkdown>
          </div>
        )}

        {inlineReviewFeedbackMarkdown?.trim() ? (
          <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm [&_a]:font-medium [&_a]:text-emerald-900 [&_a]:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdInlineFeedback}>
              {inlineReviewFeedbackMarkdown}
            </ReactMarkdown>
          </div>
        ) : null}

        {expertSupportInline?.kind === 'awaiting' ? (
          <p className="mt-3 text-xs font-medium text-amber-800">Awaiting expert to reply</p>
        ) : expertSupportInline?.kind === 'resolved' && !inlineReviewFeedbackMarkdown?.trim() ? (
          <div
            className={
              expertSupportInline.tone === 'danger'
                ? 'mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-950'
                : 'mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950'
            }
          >
            {expertSupportInline.text}
          </div>
        ) : null}

        {showExpertMenu ? (
          <div className="absolute right-2 top-2">
            <button
              type="button"
              className="rounded-md p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200"
              onClick={onToggleMenu}
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {activeMenuTurnKey === turnMenuKey ? (
              <div className="absolute right-0 z-[100] mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  disabled={requestingExpertSupport}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-slate-900 hover:bg-muted disabled:opacity-50"
                  onClick={() => {
                    onRequestExpertSupport();
                  }}
                >
                  {requestingExpertSupport ? 'Sending…' : 'Request Expert Support'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
