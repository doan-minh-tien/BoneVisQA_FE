'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, ArrowDown, Loader2, MoreHorizontal } from 'lucide-react';
import { ChatErrorBoundary } from '@/components/student/ChatErrorBoundary';
import { VisualQaStructuredAnswer } from '@/components/student/VisualQaRichAnswer';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import { Button } from '@/components/ui/button';
import type { VisualQaSessionReport, VisualQaTurn } from '@/lib/api/types';

type OptimisticMessage = {
  id: string;
  content: string;
  status?: 'sending' | 'sent' | 'failed';
};

type Props = {
  messages: VisualQaTurn[];
  capabilities?: VisualQaSessionReport['capabilities'];
  optimisticMessages?: OptimisticMessage[];
  isLoading: boolean;
  isError?: boolean;
  isRestoring?: boolean;
  networkWarning?: string | null;
  errorCode?: string | null;
  policyReason?: string | null;
  systemNoticeCode?: string | null;
  /** Session-level blocking message from GET thread (VisualQaThreadDto.blockingNotice). */
  blockingNotice?: string | null;
  errorMessage?: string | null;
  canRequestReview?: boolean;
  requestingExpertSupport?: boolean;
  onRequestExpertSupport?: (turn: VisualQaTurn) => void;
  onSendMessage: (message: string) => void | Promise<void>;
  onClear: () => void;
};

function normalizeResponseKind(kind?: string | null): 'analysis' | 'refusal' | 'clarification' | 'review_update' | 'system_notice' {
  const normalized = kind?.trim().toLowerCase();
  if (normalized === 'refusal') return 'refusal';
  if (normalized === 'clarification') return 'clarification';
  if (normalized === 'review_update') return 'review_update';
  if (normalized === 'system_notice') return 'system_notice';
  return 'analysis';
}

function formatReviewStateLabel(reviewState?: string | null): string | null {
  const normalized = reviewState?.trim().toLowerCase();
  if (!normalized || normalized === 'none') return null;
  if (normalized === 'pending') return 'Awaiting expert review';
  if (normalized === 'escalated') return 'Escalated to expert review';
  if (normalized === 'reviewed') return 'Review feedback received';
  if (normalized === 'resolved') return 'Review resolved';
  return reviewState ?? null;
}

/** Maps BE system notice codes to English; unknown technical codes are hidden (no raw SCREAMING_SNAKE in UI). */
function formatSystemNoticeCodeLabel(code: string | null | undefined): string | null {
  const c = code?.trim().toUpperCase();
  if (!c) return null;
  const map: Record<string, string> = {
    SESSION_READ_ONLY: 'Session is in read-only mode per system policy.',
    SESSION_LOCKED: 'Session is locked.',
    SESSION_EXPIRED: 'Session has expired.',
    TURN_LIMIT_EXCEEDED: 'Question limit exceeded for this Visual QA session.',
    MISSING_IMAGE: 'Image is missing.',
    MISSING_QUESTION: 'Question content is missing.',
    AI_SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable.',
    AI_RESPONSE_INVALID_FORMAT: 'AI response format is invalid.',
    INTERNAL_SERVER_ERROR: 'Server-side processing error.',
  };
  return map[c] ?? null;
}

function formatTurnTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const sameCalendarDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameCalendarDay) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function reviewUpdateRoleLabel(turn: VisualQaTurn, normalizedMessages: { role: string; content: string }[]): string {
  const fromMsg = normalizedMessages.find((m) => m.role === 'expert' || m.role === 'lecturer');
  if (fromMsg?.role === 'expert') return 'Expert';
  if (fromMsg?.role === 'lecturer') return 'Lecturer';
  const actor = (turn.actorRole ?? turn.lastResponderRole ?? '').trim().toLowerCase();
  if (actor === 'expert') return 'Expert';
  if (actor === 'lecturer' || actor === 'instructor') return 'Lecturer';
  return 'Instructor';
}

export function ChatConversation({
  messages,
  capabilities,
  optimisticMessages = [],
  isLoading,
  isError = false,
  isRestoring = false,
  networkWarning,
  errorCode,
  systemNoticeCode,
  blockingNotice,
  errorMessage,
  canRequestReview = false,
  requestingExpertSupport = false,
  onRequestExpertSupport,
  onSendMessage,
  onClear,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeAiMenuKey, setActiveAiMenuKey] = useState<string | null>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const retryMessage = optimisticMessages[optimisticMessages.length - 1]?.content?.trim() || '';
  const canAskNext = capabilities?.canAskNext ?? true;
  const capabilityReason = capabilities?.reason?.trim() || '';
  const sessionFooterNoticeLabel = formatSystemNoticeCodeLabel(systemNoticeCode);
  const isInvalidFormatError =
    isError &&
    (errorCode === 'AI_RESPONSE_INVALID_FORMAT' ||
      (typeof errorMessage === 'string' && /invalid format|malformed ai response|invalid json/i.test(errorMessage)));
  const isTurnLimitError = isError && errorCode === 'TURN_LIMIT_EXCEEDED';
  const displayedErrorMessage = isInvalidFormatError
    ? 'AI returned an invalid format. Try resending or ask a simpler question.'
    : isTurnLimitError
      ? capabilityReason || 'You have reached the question limit for this Visual QA session.'
      : errorMessage;

  const sessionFooterText = (displayedErrorMessage || (!canAskNext ? capabilityReason : '') || '').trim();
  const blockingTrim = blockingNotice?.trim() ?? '';
  const hideSessionFooterAsDuplicate =
    Boolean(blockingTrim && sessionFooterText) &&
    (sessionFooterText.toLowerCase() === blockingTrim.toLowerCase() ||
      (sessionFooterText.toLowerCase().includes('read-only') &&
        blockingTrim.toLowerCase().includes('read-only')));

  const renderedTurns = useMemo(() => {
    const blockingLower = blockingNotice?.trim().toLowerCase() ?? '';
    const mapped = messages.map((turn) => {
      const normalizedMessages = (turn.messages ?? [])
        .filter((message) => message.content?.trim())
        .map((message, idx) => ({
          id: `${turn.turnIndex}-m-${idx}`,
          role: (message.role ?? '').toLowerCase(),
          content: message.content.trim(),
        }));
      return {
        turn,
        normalizedMessages,
        studentMessage:
          normalizedMessages.find((message) => message.role === 'student' || message.role === 'user')?.content ??
          turn.questionText?.trim() ??
          '',
        assistantText:
          turn.answerText?.trim() ||
          turn.diagnosis?.trim() ||
          turn.findings?.find((item) => item.trim()) ||
          '',
        responseKind: normalizeResponseKind(turn.responseKind),
        policyReason: turn.policyReason?.trim() ?? '',
        systemNoticeCode: turn.systemNoticeCode?.trim() ?? '',
        reviewStateLabel: formatReviewStateLabel(turn.reviewState),
        reviewerNotes: normalizedMessages.filter(
          (message) => message.role === 'lecturer' || message.role === 'expert',
        ),
        reviewUpdateLabel: reviewUpdateRoleLabel(turn, normalizedMessages),
      };
    });

    const withoutBlockingDupes = mapped.filter((row) => {
      if (row.responseKind !== 'system_notice' || !blockingLower) return true;
      const body = row.assistantText.trim().toLowerCase();
      if (!body) return true;
      if (body === blockingLower) return false;
      if (blockingLower.includes('read-only') && body.includes('read-only')) return false;
      if (blockingLower.includes('review') && body.includes('review workflow')) return false;
      return true;
    });

    const seenSystemNotice = new Set<string>();
    const dedupedRows = withoutBlockingDupes.filter((row) => {
      if (row.responseKind !== 'system_notice') return true;
      const fingerprint = `${row.turn.turnId ?? row.turn.turnIndex}:${row.assistantText.trim().toLowerCase()}`;
      if (seenSystemNotice.has(fingerprint)) return false;
      seenSystemNotice.add(fingerprint);
      return true;
    });
    return dedupedRows.map((row, idx) => ({
      ...row,
      sequenceNo: idx + 1,
    }));
  }, [messages, blockingNotice]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isPinnedToBottom) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [renderedTurns, optimisticMessages, isLoading, networkWarning, isError, isPinnedToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 96);
  };

  const scrollToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setIsPinnedToBottom(true);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-5"
    >
      <ChatErrorBoundary onReset={onClear}>
        {networkWarning ? (
          <div className="mb-4 rounded-xl border border-amber-500/45 bg-amber-100 px-4 py-3 text-sm text-amber-950 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <p className="font-medium text-contrast-outline-soft">{networkWarning}</p>
            </div>
          </div>
        ) : null}

        {blockingNotice?.trim() ? (
          <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-50 px-4 py-3 text-sm text-sky-950 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sky-800" aria-hidden />
              <p className="font-medium text-contrast-outline-soft">{blockingNotice.trim()}</p>
            </div>
          </div>
        ) : null}

        {isRestoring ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Restoring conversation…
            </div>
          </div>
        ) : renderedTurns.length === 0 && optimisticMessages.length === 0 && !isLoading ? (
          <div className="flex min-h-[45vh] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Add an image for the first turn, then ask the AI. New replies will stay anchored unless you scroll up to review.
            </p>
          </div>
        ) : (
          <LayoutGroup>
            <div className="space-y-6">
              <div className="space-y-5">
                {renderedTurns.map(
                  ({
                    turn,
                    reviewerNotes,
                    studentMessage,
                    assistantText,
                    responseKind,
                    systemNoticeCode: turnSystemNoticeCode,
                    reviewStateLabel,
                    reviewUpdateLabel,
                    sequenceNo,
                  }) => {
                    const systemNoticeLabel = formatSystemNoticeCodeLabel(turnSystemNoticeCode);
                    return (
                  <div
                    key={turn.turnId ?? `${turn.turnIndex}-${turn.createdAt ?? ''}`}
                    className="w-full rounded-xl text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {formatTurnTimestamp(turn.createdAt) ?? `Turn #${sequenceNo}`}
                        </span>
                      </div>
                      {studentMessage ? (
                        <motion.div
                          className="chat-send-rise flex justify-end"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                          layout
                        >
                          <div className="max-w-[92%] overflow-hidden break-words rounded-2xl border border-[#003ebd] bg-[#0055ff] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                ...markdownExternalLinkComponents,
                                p: ({ children }) => (
                                  <p className="text-contrast-outline mb-2 last:mb-0 leading-relaxed">{children}</p>
                                ),
                              }}
                            >
                              {studentMessage}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      ) : null}

                      <motion.div
                        className="group flex justify-start"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        layout
                      >
                        <div className="relative max-w-[92%] overflow-hidden break-words rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-950 shadow-sm [&_a]:break-all [&_pre]:overflow-x-auto">
                          {responseKind === 'analysis' ? (
                            <VisualQaStructuredAnswer
                              markdown={turn.answerText}
                              diagnosis={turn.diagnosis}
                              findings={turn.findings}
                              differentialDiagnoses={turn.differentialDiagnoses}
                              reflectiveQuestions={turn.reflectiveQuestions}
                              citations={turn.citations ?? []}
                            />
                          ) : responseKind === 'clarification' || responseKind === 'refusal' ? (
                            <div className="space-y-2">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ...markdownExternalLinkComponents,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                }}
                              >
                                {assistantText || 'The assistant returned a non-analysis response.'}
                              </ReactMarkdown>
                            </div>
                          ) : responseKind === 'system_notice' ? (
                            <div className="space-y-2">
                              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                                System notice
                              </p>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ...markdownExternalLinkComponents,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                }}
                              >
                                {assistantText || 'This session has a new system notice.'}
                              </ReactMarkdown>
                              {systemNoticeLabel ? (
                                <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                  {systemNoticeLabel}
                                </div>
                              ) : null}
                            </div>
                          ) : responseKind === 'review_update' ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                                {reviewUpdateLabel}:
                              </p>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ...markdownExternalLinkComponents,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                }}
                              >
                                {assistantText || reviewStateLabel || ''}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ...markdownExternalLinkComponents,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                }}
                              >
                                {assistantText || 'The assistant returned a response.'}
                              </ReactMarkdown>
                            </div>
                          )}

                          {reviewStateLabel && responseKind !== 'review_update' ? (
                            <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-900">
                              {reviewStateLabel}
                            </div>
                          ) : null}

                          {canRequestReview &&
                          (turn.actorRole?.trim().toLowerCase() === 'assistant' ||
                            turn.isReviewTarget === true ||
                            responseKind === 'analysis') ? (
                            <div className="absolute right-2 top-2">
                              <button
                                type="button"
                                className="rounded-md p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-slate-200"
                                onClick={() =>
                                  setActiveAiMenuKey((prev) =>
                                    prev === (turn.turnId ?? String(turn.turnIndex))
                                      ? null
                                      : (turn.turnId ?? String(turn.turnIndex)),
                                  )
                                }
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {activeAiMenuKey === (turn.turnId ?? String(turn.turnIndex)) ? (
                                <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-border bg-white p-1 shadow-lg">
                                  <button
                                    type="button"
                                    disabled={requestingExpertSupport}
                                    className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                                    onClick={() => {
                                      setActiveAiMenuKey(null);
                                      onRequestExpertSupport?.(turn);
                                    }}
                                  >
                                    {requestingExpertSupport ? 'Sending…' : 'Request Expert Support'}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>

                      {responseKind !== 'review_update' && reviewerNotes.length > 0 ? (
                          <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Instructor async feedback notes
                            </p>
                            {reviewerNotes.map((message) => {
                              const isExpertNote = message.role === 'expert';
                              return (
                                <div
                                  key={message.id}
                                  className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                                    isExpertNote
                                      ? 'border-emerald-500/45 bg-emerald-50 text-emerald-950'
                                      : 'border-orange-500/45 bg-orange-50 text-orange-950'
                                  }`}
                                >
                                  <p
                                    className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
                                      isExpertNote ? 'text-emerald-900' : 'text-orange-900'
                                    }`}
                                  >
                                    {isExpertNote ? 'Expert feedback' : 'Lecturer feedback'}
                                  </p>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      ...markdownExternalLinkComponents,
                                      p: ({ children }) => (
                                        <p className="text-contrast-outline-soft mb-2 last:mb-0 leading-relaxed">
                                          {children}
                                        </p>
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                    </div>
                  </div>
                );
                })}

                <AnimatePresence initial={false}>
                  {optimisticMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      className="flex justify-end"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      layout
                    >
                      <div className="max-w-[92%] rounded-2xl border border-[#003ebd] bg-[#0055ff] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                        <p className="text-contrast-outline mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          {message.status === 'failed'
                            ? 'Failed'
                            : message.status === 'sent'
                              ? 'Sent'
                              : 'Sending'}
                        </p>
                        <div className="text-contrast-outline">{message.content}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {isLoading ? (
                  <motion.div
                    key="typing"
                    className="flex justify-start"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    layout
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-2xl border border-border/70 bg-slate-100 px-4 py-3" aria-hidden>
                      <span className="messenger-typing-dot" />
                      <span className="messenger-typing-dot" />
                      <span className="messenger-typing-dot" />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {!isLoading &&
              !hideSessionFooterAsDuplicate &&
              ((!canAskNext && capabilityReason) || (isError && displayedErrorMessage)) ? (
                <motion.div
                  className="flex justify-start"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  layout
                >
                  <div className="max-w-[92%] rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-950 shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      System notice
                    </p>
                    <p className="mt-2 leading-relaxed">
                      {displayedErrorMessage || capabilityReason}
                    </p>
                    {sessionFooterNoticeLabel ? (
                      <p className="mt-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        {sessionFooterNoticeLabel}
                      </p>
                    ) : null}
                    {isError && displayedErrorMessage ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {retryMessage && !isTurnLimitError ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => void onSendMessage(retryMessage)}>
                            {isInvalidFormatError ? 'Try Resending' : 'Retry'}
                          </Button>
                        ) : null}
                        {isInvalidFormatError ? (
                          <Button type="button" size="sm" variant="outline" onClick={onClear}>
                            Ask a simpler question
                          </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="outline" onClick={onClear}>
                          Clear
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </LayoutGroup>
        )}
      </ChatErrorBoundary>
      {!isPinnedToBottom && renderedTurns.length > 0 ? (
        <div className="sticky bottom-2 z-10 flex w-full justify-center pb-2 pt-1 pointer-events-none">
          <button
            type="button"
            onClick={scrollToLatest}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted"
            aria-label="Scroll to latest messages"
          >
            <ArrowDown className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
