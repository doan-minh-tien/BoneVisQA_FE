'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { AnnotationOverlay } from '@/components/shared/AnnotationOverlay';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExpertReviewQueueSkeleton } from '@/components/shared/DashboardSkeletons';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import { PolygonAnnotationOverlay } from '@/components/shared/PolygonAnnotationOverlay';
import { RectangleAnnotationOverlay } from '@/components/shared/RectangleAnnotationOverlay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  approveExpertReview,
  fetchExpertReviewQueue,
  flagRagChunk,
  hasExpertReviewSelectedPairMismatch,
  postExpertResponse,
  REVIEW_WORKFLOW_CONFLICT,
  type PromoteExpertReviewPayload,
  promoteExpertReview,
  putExpertReview,
} from '@/lib/api/expert-reviews';
import type { ExpertReviewCitation, ExpertReviewItem, VisualQaReport } from '@/lib/api/types';
import { splitLearningBullets } from '@/lib/utils/learning-text';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';
import { canExpertApprove, getWorkflowStatusMeta, isExpertApproved } from '@/lib/visual-qa-workflow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast as sonnerToast } from 'sonner';
import { isNextImageRemoteOptimized } from '@/lib/images/remote-image';
import { resolveApiAssetUrl } from '@/lib/api/client';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Flag,
  Inbox,
  Link2,
  RefreshCw,
  Save,
  Send,
  User,
  XCircle,
} from 'lucide-react';

function ExpertImagingOverlays({ item }: { item: ExpertReviewItem }) {
  try {
    if (item.customBoundingBox && isValidNormalizedBoundingBox(item.customBoundingBox)) {
      return (
        <RectangleAnnotationOverlay
          closed={item.customBoundingBox}
          draft={null}
          label="STUDENT ROI"
          className="drop-shadow-[0_0_12px_rgba(239,68,68,0.35)]"
        />
      );
    }
    if (item.customPolygon && item.customPolygon.length >= 3) {
      return (
        <PolygonAnnotationOverlay
          closed={item.customPolygon}
          draft={[]}
          label="STUDENT ROI"
          className="drop-shadow-[0_0_12px_rgba(239,68,68,0.35)]"
        />
      );
    }
    return (
      <AnnotationOverlay
        box={item.customCoordinates}
        label="STUDENT ROI"
        className="border-dashed border-cyan-accent text-cyan-accent shadow-[0_0_28px_rgba(0,229,255,0.3)]"
      />
    );
  } catch {
    return null;
  }
}

function toWorkflowFriendlyError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message === REVIEW_WORKFLOW_CONFLICT) {
    return 'This review state was already updated by another action. Please refresh the queue.';
  }
  return error instanceof Error ? error.message : fallback;
}

/** `VisualQaReport.reflectiveQuestions` may be string or string[] from the API. */
function reflectiveQuestionsToEditText(
  report: VisualQaReport,
  itemFallback: string | null | undefined,
): string {
  const r = report.reflectiveQuestions;
  if (r != null) {
    if (Array.isArray(r)) {
      return r.map((x) => String(x).trim()).filter(Boolean).join('\n');
    }
    return String(r).trim();
  }
  return itemFallback?.trim() ?? '';
}

export default function ExpertReviewsPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState<ExpertReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [active, setActive] = useState<ExpertReviewItem | null>(null);
  const [diag, setDiag] = useState('');
  const [keyText, setKeyText] = useState('');
  const [keyImagingEdit, setKeyImagingEdit] = useState('');
  const [reflectiveEdit, setReflectiveEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [flaggingChunkId, setFlaggingChunkId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingResponseSessionId, setSendingResponseSessionId] = useState<string | null>(null);
  const [approvingSessionId, setApprovingSessionId] = useState<string | null>(null);
  const [promotingSessionId, setPromotingSessionId] = useState<string | null>(null);
  const [promoteTargetSessionId, setPromoteTargetSessionId] = useState<string | null>(null);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteDraft, setPromoteDraft] = useState<PromoteExpertReviewPayload>({
    description: '',
    suggestedDiagnosis: '',
    keyFindings: '',
    reflectiveQuestions: '',
  });
  const openedFocusRef = useRef<string | null>(null);
  const { trigger: triggerFlagChunk } = useSWRMutation(
    'expert-flag-chunk',
    async (_key, { arg }: { arg: { chunkId: string; reason: string } }) =>
      flagRagChunk(arg.chunkId, { reason: arg.reason }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExpertReviewQueue();
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = useCallback((item: ExpertReviewItem) => {
    setActive(item);
    setDiag(item.report.suggestedDiagnosis || '');
    setKeyText(item.report.keyFindings.join('\n'));
    setKeyImagingEdit(item.report.keyImagingFindings?.trim() ?? item.keyImagingFindings?.trim() ?? '');
    setReflectiveEdit(reflectiveQuestionsToEditText(item.report, item.reflectiveQuestions));
    setExpanded(item.id);
  }, []);

  useEffect(() => {
    const focus = searchParams.get('focus')?.trim();
    if (!focus || items.length === 0) return;
    if (openedFocusRef.current === focus) return;
    const match = items.find((i) => i.id === focus || i.sessionId === focus || i.answerId === focus);
    if (match) {
      openedFocusRef.current = focus;
      openEdit(match);
    }
  }, [items, searchParams, openEdit]);

  const openFlagModal = (chunkId: string) => {
    setFlaggingChunkId(chunkId);
    setFlagReason('');
  };

  const closeFlagModal = () => {
    setFlaggingChunkId(null);
    setFlagReason('');
  };

  const submitFlag = async () => {
    if (!flaggingChunkId) return;
    const reason = flagReason.trim();
    if (!reason) {
      toast.error('Please provide a reason before flagging this chunk.');
      return;
    }

    setSubmittingFlag(true);
    try {
      await triggerFlagChunk({ chunkId: flaggingChunkId, reason });
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          citations: item.citations?.map((citation) =>
            citation.chunkId === flaggingChunkId
              ? { ...citation, flagged: true }
              : citation,
          ),
        })),
      );
      toast.success('Chunk flagged for data quality review.');
      closeFlagModal();
    } catch (error) {
      toast.error(toWorkflowFriendlyError(error, 'Failed to flag RAG chunk.'));
    } finally {
      setSubmittingFlag(false);
    }
  };

  const submit = async (status: 'Approved' | 'Rejected') => {
    if (!active) return;
    if (hasExpertReviewSelectedPairMismatch(active)) {
      toast.error('Selected pair mismatch. Refresh the queue and open this case again.');
      return;
    }
    setSaving(true);
    try {
      const normalizedFindings = keyText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await putExpertReview(active.sessionId, {
        answerText: active.report.answerText || '',
        structuredDiagnosis: diag.trim() || active.report.suggestedDiagnosis || '',
        differentialDiagnoses:
          normalizedFindings.length > 0
            ? normalizedFindings
            : active.report.differentialDiagnoses,
        reviewNote:
          status === 'Approved'
            ? 'Approved by expert reviewer.'
            : 'Rejected by expert reviewer.',
        keyImagingFindings: keyImagingEdit.trim() || null,
        reflectiveQuestions: reflectiveEdit.trim() || null,
      });
      const removedId = active.id;
      setItems((prev) => prev.filter((i) => i.id !== removedId));
      setExpanded((e) => (e === removedId ? null : e));
      setActive(null);
      sonnerToast.success(
        status === 'Approved'
          ? 'Gold-standard answer sent to the student and flagged for Knowledge Base integration.'
          : 'Decision recorded. The student will be notified per your review outcome.',
        { duration: 6000 },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const quickApprove = async (item: ExpertReviewItem) => {
    if (hasExpertReviewSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch. Refresh the queue before approving.');
      return;
    }
    setSaving(true);
    try {
      await putExpertReview(item.sessionId, {
        answerText: item.report.answerText || '',
        structuredDiagnosis: item.report.suggestedDiagnosis || '',
        differentialDiagnoses: item.report.differentialDiagnoses,
        reviewNote: 'Approved by expert reviewer.',
        keyImagingFindings: item.report.keyImagingFindings ?? null,
        reflectiveQuestions:
          reflectiveQuestionsToEditText(item.report, item.reflectiveQuestions) || null,
      });
      const rid = item.id;
      setItems((prev) => prev.filter((i) => i.id !== rid));
      setExpanded((e) => (e === rid ? null : e));
      if (active?.id === rid) setActive(null);
      sonnerToast.success(
        'Answer approved and delivered to the student. Flagged for Knowledge Base integration.',
        { duration: 6000 },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const quickReject = async (item: ExpertReviewItem) => {
    if (hasExpertReviewSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch. Refresh the queue before rejecting.');
      return;
    }
    setSaving(true);
    try {
      await putExpertReview(item.sessionId, {
        answerText: item.report.answerText || '',
        structuredDiagnosis: item.report.suggestedDiagnosis || '',
        differentialDiagnoses: item.report.differentialDiagnoses,
        reviewNote: 'Rejected by expert reviewer.',
        keyImagingFindings: item.report.keyImagingFindings ?? null,
        reflectiveQuestions:
          reflectiveQuestionsToEditText(item.report, item.reflectiveQuestions) || null,
      });
      const jid = item.id;
      setItems((prev) => prev.filter((i) => i.id !== jid));
      setExpanded((e) => (e === jid ? null : e));
      if (active?.id === jid) setActive(null);
      sonnerToast.message('Review recorded', {
        description: 'The student will be notified. This item is removed from your pending queue.',
        duration: 5000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const submitExpertReply = async (item: ExpertReviewItem) => {
    if (hasExpertReviewSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch. Refresh the queue before sending feedback.');
      return;
    }
    const content = (replyDrafts[item.sessionId] ?? '').trim();
    if (!content) {
      toast.error('Please enter feedback before sending.');
      return;
    }
    setSendingResponseSessionId(item.sessionId);
    try {
      await postExpertResponse(item.sessionId, content);
      setReplyDrafts((prev) => ({ ...prev, [item.sessionId]: '' }));
      setItems((prev) =>
        prev.map((row) => {
          if (row.id !== item.id || !row.turns || row.turns.length === 0) return row;
          const nextTurns = [...row.turns];
          const lastIdx = nextTurns.length - 1;
          const lastTurn = nextTurns[lastIdx];
          const existingMessages = lastTurn.messages ?? [
            ...(lastTurn.questionText
              ? [{ role: 'Student', content: lastTurn.questionText, createdAt: lastTurn.createdAt ?? null }]
              : []),
            ...(lastTurn.answerText
              ? [{ role: 'Assistant', content: lastTurn.answerText, createdAt: lastTurn.createdAt ?? null }]
              : []),
          ];
          nextTurns[lastIdx] = {
            ...lastTurn,
            messages: [
              ...existingMessages,
              { role: 'Expert', content, createdAt: new Date().toISOString() },
            ],
          };
          return { ...row, turns: nextTurns };
        }),
      );
      toast.success('Expert feedback sent to student.');
    } catch (error) {
      toast.error(toWorkflowFriendlyError(error, 'Failed to send expert feedback.'));
    } finally {
      setSendingResponseSessionId(null);
    }
  };

  const submitExpertApprove = async (item: ExpertReviewItem) => {
    if (hasExpertReviewSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch. Refresh the queue before validating.');
      return;
    }
    setApprovingSessionId(item.sessionId);
    try {
      await approveExpertReview(item.sessionId);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, status: 'ExpertApproved' }
            : row,
        ),
      );
      toast.success('Review approved and clinically validated.');
    } catch (error) {
      toast.error(toWorkflowFriendlyError(error, 'Failed to approve this review.'));
    } finally {
      setApprovingSessionId(null);
    }
  };

  const openPromoteModal = (item: ExpertReviewItem) => {
    if (hasExpertReviewSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch. Refresh the queue before promoting.');
      return;
    }
    const firstStudentQuestion = (() => {
      const firstTurn = item.turns?.[0];
      if (!firstTurn) return item.questionText?.trim() || item.question?.trim() || '';
      const messageQuestion = (firstTurn.messages ?? []).find((message) => {
        const role = (message.role ?? '').toLowerCase();
        return role === 'student' || role === 'user';
      });
      return (
        messageQuestion?.content?.trim() ||
        firstTurn.questionText?.trim() ||
        item.questionText?.trim() ||
        item.question?.trim() ||
        ''
      );
    })();

    const lastExpertReply = (() => {
      const turns = item.turns ?? [];
      for (let i = turns.length - 1; i >= 0; i -= 1) {
        const messages = turns[i]?.messages ?? [];
        for (let j = messages.length - 1; j >= 0; j -= 1) {
          const msg = messages[j];
          if ((msg.role ?? '').toLowerCase() === 'expert' && msg.content?.trim()) {
            return msg.content.trim();
          }
        }
      }
      return '';
    })();

    setPromoteTargetSessionId(item.sessionId);
    setPromoteDraft({
      description: firstStudentQuestion,
      suggestedDiagnosis: lastExpertReply,
      keyFindings: '',
      reflectiveQuestions: '',
    });
    setPromoteModalOpen(true);
  };

  const submitExpertPromote = async () => {
    if (!promoteTargetSessionId) return;
    const promoteItem = items.find((i) => i.sessionId === promoteTargetSessionId);
    if (promoteItem && hasExpertReviewSelectedPairMismatch(promoteItem)) {
      toast.error('Selected pair mismatch. Refresh the queue before promoting.');
      return;
    }
    const payload = {
      description: promoteDraft.description.trim(),
      suggestedDiagnosis: promoteDraft.suggestedDiagnosis.trim(),
      keyFindings: promoteDraft.keyFindings.trim(),
      reflectiveQuestions: promoteDraft.reflectiveQuestions.trim(),
    };
    if (!payload.description || !payload.suggestedDiagnosis || !payload.keyFindings || !payload.reflectiveQuestions) {
      toast.error('Please complete all four fields before publishing.');
      return;
    }

    setPromotingSessionId(promoteTargetSessionId);
    try {
      const promotedCaseId = await promoteExpertReview(promoteTargetSessionId, payload);
      if (promotedCaseId) {
        setItems((prev) =>
          prev.map((row) =>
            row.sessionId === promoteTargetSessionId
              ? { ...row, promotedCaseId }
              : row,
          ),
        );
      } else {
        await load();
      }
      toast.success('Case has been published to the system case library.');
      setPromoteModalOpen(false);
      setPromoteTargetSessionId(null);
    } catch (error) {
      toast.error(toWorkflowFriendlyError(error, 'Failed to publish this case.'));
    } finally {
      setPromotingSessionId(null);
    }
  };

  const pending = items.filter((i) => !isTerminal(i.status)).length;

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Header title="Expert review workbench" subtitle={`${pending} item(s) awaiting decision`} />
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh queue
          </Button>
        </div>
        {loading ? (
          <ExpertReviewQueueSkeleton />
        ) : (
          <div className="space-y-4">
            {items.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-6 w-6 text-cyan-accent" />}
                title="All caught up!"
                description="There are no escalated cases requiring your expert review right now."
              />
            ) : (
              items.map((item) => {
                const isExp = expanded === item.id;
                const confidence = getConfidenceScore(item);
                const isEditing = active?.id === item.id;
                const pairMismatch = hasExpertReviewSelectedPairMismatch(item);
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-border-color bg-surface shadow-panel"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isExp ? null : item.id)}
                      className="flex w-full items-start gap-3 px-5 py-5 text-left hover:bg-background/20"
                    >
                      {isExp ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-relaxed text-text-main">
                              {item.question}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.studentName}
                          </span>
                          {item.className ? (
                            <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
                              {item.className}
                            </span>
                          ) : null}
                          <span>{item.askedAt}</span>
                          <StatusBadge status={item.status} />
                            </div>
                          </div>
                          {confidence !== null ? (
                            <div className="w-full max-w-[180px]">
                              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-text-muted">
                                <span>AI confidence</span>
                                <span className="text-cyan-accent">{confidence.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-background">
                                <div
                                  className="h-full rounded-full bg-cyan-accent"
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    {isExp && (
                      <div className="border-t border-border-color px-5 py-5">
                        {pairMismatch ? (
                          <div className="mb-4 rounded-xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            <p className="font-semibold text-amber-50">Selected pair mismatch</p>
                            <p className="mt-1 text-amber-100/90">
                              Review message IDs do not match the loaded session turns. Refresh the queue before saving,
                              approving, or promoting.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 border-amber-400/70 text-amber-50 hover:bg-amber-500/20"
                              disabled={loading}
                              onClick={() => void load()}
                            >
                              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                              Reload queue
                            </Button>
                          </div>
                        ) : null}
                        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                          <section className="space-y-4">
                            <div className="rounded-xl border border-border-color bg-black p-3">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                Imaging
                              </p>
                              <div className="overflow-hidden rounded-lg border border-border-color bg-black p-2">
                                {item.imageUrl ? (
                                  <div className="relative mx-auto w-fit">
                                    <Image
                                      src={resolveApiAssetUrl(item.imageUrl)}
                                      alt="Study"
                                      width={1200}
                                      height={900}
                                      unoptimized={!isNextImageRemoteOptimized(resolveApiAssetUrl(item.imageUrl))}
                                      className="mx-auto max-h-[420px] max-w-full object-contain"
                                    />
                                    <ExpertImagingOverlays item={item} />
                                  </div>
                                ) : (
                                  <div className="flex min-h-[280px] items-center justify-center text-sm text-text-muted">
                                    No image available for this request.
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.caseDescription?.trim() ||
                            item.caseSuggestedDiagnosis?.trim() ||
                            item.caseKeyFindings?.trim() ? (
                              <div className="rounded-xl border border-border-color bg-surface p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                  Case snapshot (catalog)
                                </p>
                                {item.caseId?.trim() ? (
                                  <p className="mb-2 text-[11px] text-text-muted">
                                    Case ID:{' '}
                                    <span className="font-mono text-text-main">{item.caseId.trim()}</span>
                                  </p>
                                ) : null}
                                {item.caseDescription?.trim() ? (
                                  <p className="text-sm leading-relaxed text-text-main">{item.caseDescription.trim()}</p>
                                ) : null}
                                {item.caseSuggestedDiagnosis?.trim() ? (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                      Suggested diagnosis
                                    </p>
                                    <p className="mt-1 text-sm text-text-main">{item.caseSuggestedDiagnosis.trim()}</p>
                                  </div>
                                ) : null}
                                {item.caseKeyFindings?.trim() ? (
                                  <div className="mt-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                      Key findings
                                    </p>
                                    <p className="mt-1 text-sm text-text-main">{item.caseKeyFindings.trim()}</p>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            <div className="rounded-xl border border-border-color bg-surface p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-accent">
                                Left pane · Expert edit mode
                              </p>
                              <p className="mb-4 text-sm leading-relaxed text-text-main">{item.question}</p>
                              <div className="mb-4 rounded-xl border border-border-color bg-background/40 p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                                  Session chat history
                                </p>
                                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                                  {item.turns && item.turns.length > 0 ? (
                                    item.turns.map((turn) => {
                                      const normalizedMessages = (turn.messages ?? [])
                                        .filter((message) => message.content?.trim())
                                        .map((message, idx) => ({
                                          id: `${turn.turnIndex}-m-${idx}`,
                                          role: (message.role ?? '').toLowerCase(),
                                          content: message.content.trim(),
                                        }));
                                      const fallbackMessages =
                                        normalizedMessages.length > 0
                                          ? normalizedMessages
                                          : [
                                              {
                                                id: `${turn.turnIndex}-student`,
                                                role: 'student',
                                                content: turn.questionText?.trim() || '—',
                                              },
                                              {
                                                id: `${turn.turnIndex}-assistant`,
                                                role: 'assistant',
                                                content: turn.answerText?.trim() || '—',
                                              },
                                            ];
                                      return (
                                        <div key={`turn-${turn.turnIndex}`} className="space-y-2 rounded-lg border border-border-color/80 p-3">
                                          {fallbackMessages.map((message) => {
                                            const role = message.role;
                                            const isStudent = role === 'student' || role === 'user';
                                            const isExpert = role === 'expert';
                                            const isLecturer = role === 'lecturer';
                                            const label = isExpert
                                              ? 'Expert feedback'
                                              : isLecturer
                                                ? 'Lecturer feedback'
                                                : isStudent
                                                  ? 'Student'
                                                  : 'AI';
                                            return (
                                              <div key={message.id} className={`rounded-lg border px-3 py-2 text-sm ${
                                                isStudent
                                                  ? 'border-border-color bg-surface'
                                                  : isExpert
                                                    ? 'border-emerald-400/40 bg-emerald-500/10'
                                                    : isLecturer
                                                      ? 'border-orange-400/40 bg-orange-500/10'
                                                      : 'border-cyan-accent/30 bg-cyan-accent/10'
                                              }`}>
                                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                                  {label}
                                                </p>
                                                <p className="whitespace-pre-wrap leading-relaxed text-text-main">
                                                  {message.content}
                                                </p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-sm text-text-muted">No session turns available.</p>
                                  )}
                                </div>
                                <div className="mt-4 space-y-2">
                                  <textarea
                                    value={replyDrafts[item.sessionId] ?? ''}
                                    onChange={(e) =>
                                      setReplyDrafts((prev) => ({
                                        ...prev,
                                        [item.sessionId]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                    disabled={pairMismatch}
                                    placeholder="Enter expert feedback for the student..."
                                    className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
                                  />
                                  <div className="flex flex-wrap justify-end gap-2">
                                    {(() => {
                                      const statusMeta = getWorkflowStatusMeta(item.status);
                                      const isApproved = isExpertApproved(item.status);
                                      const canApprove = canExpertApprove(item.status);
                                      const canPromote =
                                        !item.promotedCaseId && isApproved && Boolean(item.customImageUrl) && !item.imageId;
                                      return (
                                        <>
                                    <Button
                                      type="button"
                                      onClick={() => void submitExpertReply(item)}
                                      isLoading={sendingResponseSessionId === item.sessionId}
                                      disabled={
                                        pairMismatch || sendingResponseSessionId === item.sessionId
                                      }
                                    >
                                      <Send className="h-4 w-4" />
                                      Send feedback
                                    </Button>
                                    {canApprove ? (
                                      <Button
                                        type="button"
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() => void submitExpertApprove(item)}
                                        isLoading={approvingSessionId === item.sessionId}
                                        disabled={
                                          pairMismatch || approvingSessionId === item.sessionId
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve and validate
                                      </Button>
                                    ) : null}
                                    {canPromote ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="border-violet-500/60 text-violet-200 hover:bg-violet-500/15"
                                        onClick={() => openPromoteModal(item)}
                                        isLoading={promotingSessionId === item.sessionId}
                                        disabled={
                                          pairMismatch || promotingSessionId === item.sessionId
                                        }
                                      >
                                        <Save className="h-4 w-4" />
                                        Add to Library
                                      </Button>
                                    ) : null}
                                  </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <ReportWorkbench
                                report={item.report}
                                isEditing={isEditing}
                                lockFields={pairMismatch}
                                diag={diag}
                                keyText={keyText}
                                keyImagingText={keyImagingEdit}
                                reflectiveText={reflectiveEdit}
                                onDiagChange={setDiag}
                                onKeyTextChange={setKeyText}
                                onKeyImagingChange={setKeyImagingEdit}
                                onReflectiveChange={setReflectiveEdit}
                                onBeginEdit={() => openEdit(item)}
                              />
                            </div>
                          </section>

                          <section className="xl:sticky xl:top-5">
                            <EvidencePanel
                              citations={item.citations ?? []}
                              onFlag={openFlagModal}
                              flagsDisabled={pairMismatch}
                            />
                          </section>
                        </div>

                        {!isTerminal(item.status) && (
                          <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-color bg-background/95 p-4 backdrop-blur">
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                              <AlertCircle className="h-4 w-4 text-cyan-accent" />
                              Approved responses are pushed to the public student reference library.
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!isEditing ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={saving || pairMismatch}
                                  onClick={() => openEdit(item)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit diagnosis / findings
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={saving || pairMismatch}
                                  onClick={() => void submit('Approved')}
                                >
                                  <Save className="h-4 w-4" />
                                  Save edits
                                </Button>
                              )}
                              <Button
                                type="button"
                                className="min-w-[220px]"
                                disabled={saving || pairMismatch}
                                isLoading={saving}
                                onClick={() => (isEditing ? void submit('Approved') : void quickApprove(item))}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve for library
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-danger text-danger hover:bg-danger/10"
                                disabled={saving || pairMismatch}
                                onClick={() => (isEditing ? void submit('Rejected') : void quickReject(item))}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <FlagChunkModal
        open={Boolean(flaggingChunkId)}
        reason={flagReason}
        submitting={submittingFlag}
        onReasonChange={setFlagReason}
        onClose={closeFlagModal}
        onSubmit={() => void submitFlag()}
      />
      <PromoteCaseModal
        open={promoteModalOpen}
        value={promoteDraft}
        submitting={Boolean(promotingSessionId)}
        canSubmit={
          Boolean(promoteDraft.description.trim()) &&
          Boolean(promoteDraft.suggestedDiagnosis.trim()) &&
          Boolean(promoteDraft.keyFindings.trim()) &&
          Boolean(promoteDraft.reflectiveQuestions.trim())
        }
        onChange={setPromoteDraft}
        onClose={() => {
          if (promotingSessionId) return;
          setPromoteModalOpen(false);
          setPromoteTargetSessionId(null);
        }}
        onSubmit={() => void submitExpertPromote()}
      />

    </div>
  );
}

function EvidencePanel({
  citations,
  onFlag,
  flagsDisabled,
}: {
  citations: ExpertReviewCitation[];
  onFlag: (chunkId: string) => void;
  flagsDisabled?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border-color bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Right pane · RAG Evidence & Citations
          </h4>
          <p className="mt-1 text-sm text-text-muted">
            Review the exact evidence chunks the AI used before approving this answer.
          </p>
        </div>
      </div>

      {citations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-color bg-background/40 px-4 py-6 text-sm text-text-muted">
          No evidence chunks were returned for this case.
        </div>
      ) : (
        <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
          {citations.map((citation, index) => (
            <article
              key={citation.chunkId}
              className={`rounded-xl border p-4 ${
                citation.flagged
                  ? 'border-danger/60 bg-danger/5'
                  : 'border-border-color bg-background/40'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="rounded-full bg-cyan-accent/10 px-2 py-1 font-medium text-cyan-accent">
                    Chunk {index + 1}
                  </span>
                  {citation.pageNumber != null ? (
                    <span>Page {citation.pageNumber}</span>
                  ) : null}
                  {citation.flagged ? (
                    <span className="rounded-full bg-danger/10 px-2 py-1 font-medium text-danger">
                      Flagged
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={citation.flagged ? 'outline' : 'destructive'}
                  disabled={citation.flagged || flagsDisabled}
                  onClick={() => onFlag(citation.chunkId)}
                  title={
                    citation.flagged
                      ? 'Issue already flagged'
                      : flagsDisabled
                        ? 'Refresh the queue to continue'
                        : 'Flag this chunk'
                  }
                  aria-label={
                    citation.flagged
                      ? 'Issue already flagged'
                      : flagsDisabled
                        ? 'Refresh the queue to continue'
                        : 'Flag this chunk'
                  }
                  className="!px-2.5"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>

              <blockquote className="rounded-lg border-l-4 border-cyan-accent bg-surface px-4 py-3 text-sm leading-relaxed text-text-main">
                {citation.sourceText}
              </blockquote>

              {citation.referenceUrl ? (
                <a
                  href={citation.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-accent underline decoration-cyan-accent/50 underline-offset-4 hover:text-cyan-accent/80"
                >
                  <Link2 className="h-4 w-4" />
                  Open source reference
                </a>
              ) : (
                <p className="mt-3 text-xs text-text-muted">No reference URL was supplied for this chunk.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FlagChunkModal({
  open,
  reason,
  submitting,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  reason: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border-color bg-surface p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-text-main">Flag evidence chunk</h3>
        <p className="mt-2 text-sm text-text-muted">
          Explain why this citation is low quality or not relevant to the reviewed case.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={5}
          placeholder="Examples: outdated information, irrelevant chunk, truncated context, mismatched anatomy..."
          className="mt-4 w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" isLoading={submitting} onClick={onSubmit}>
            <Flag className="h-4 w-4" />
            Submit Flag
          </Button>
        </div>
      </div>
    </div>
  );
}

function PromoteCaseModal({
  open,
  value,
  submitting,
  canSubmit,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  value: PromoteExpertReviewPayload;
  submitting: boolean;
  canSubmit: boolean;
  onChange: (next: PromoteExpertReviewPayload) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  const updateField = (key: keyof PromoteExpertReviewPayload, fieldValue: string) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border-color bg-surface p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-text-main">Publish Case to Library</h3>
        <p className="mt-2 text-sm text-text-muted">
          Expert review is required. Complete all educational fields before publishing.
        </p>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Description</label>
            <textarea
              value={value.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Suggested Diagnosis</label>
            <textarea
              value={value.suggestedDiagnosis}
              onChange={(e) => updateField('suggestedDiagnosis', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Key Findings</label>
            <textarea
              value={value.keyFindings}
              onChange={(e) => updateField('keyFindings', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Reflective Questions</label>
            <textarea
              value={value.reflectiveQuestions}
              onChange={(e) => updateField('reflectiveQuestions', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit || submitting} isLoading={submitting} onClick={onSubmit}>
            Confirm Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

function getConfidenceScore(item: ExpertReviewItem): number | null {
  const raw =
    (item as ExpertReviewItem & { aiConfidenceScore?: number }).aiConfidenceScore ??
    item.report.aiConfidenceScore;

  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return raw <= 1 ? raw * 100 : raw;
  }
  return null;
}

function isTerminal(status: string) {
  return getWorkflowStatusMeta(status).terminal;
}

function StatusBadge({ status }: { status: string }) {
  const meta = getWorkflowStatusMeta(status);
  if (meta.tone === 'success') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        <CheckCircle className="h-3 w-3" /> {meta.label}
      </span>
    );
  }
  if (meta.tone === 'danger') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" /> {meta.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
      <Clock className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function ReportSections({ report }: { report: VisualQaReport }) {
  const imagingLines = splitLearningBullets(report.keyImagingFindings ?? undefined);
  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Answer / explanation
        </h4>
        <div className="rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownExternalLinkComponents }}>
            {report.answerText || '—'}
          </ReactMarkdown>
        </div>
      </section>
      {report.suggestedDiagnosis ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Suggested diagnosis
          </h4>
          <div className="rounded-xl border border-border-color bg-surface px-4 py-4">
            <p className="text-base font-semibold leading-relaxed text-text-main">
              {report.suggestedDiagnosis}
            </p>
          </div>
        </section>
      ) : null}
      {report.keyFindings.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Key findings
          </h4>
          <ul className="space-y-3 rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
            {report.keyFindings.map((k, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {imagingLines.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Key imaging findings
          </h4>
          <ul className="space-y-2 rounded-xl border border-cyan-accent/25 bg-surface px-4 py-4 text-sm text-text-main">
            {imagingLines.map((k, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {(() => {
        const rq = reflectiveQuestionsToEditText(report, null);
        return rq ? (
          <section className="rounded-xl border border-amber-400/35 bg-amber-500/5 px-4 py-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">
              Reflective questions
            </h4>
            <div className="text-sm leading-relaxed text-text-main">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownExternalLinkComponents }}>
                {rq}
              </ReactMarkdown>
            </div>
          </section>
        ) : null;
      })()}
    </div>
  );
}

function ReportWorkbench({
  report,
  isEditing,
  lockFields,
  diag,
  keyText,
  keyImagingText,
  reflectiveText,
  onDiagChange,
  onKeyTextChange,
  onKeyImagingChange,
  onReflectiveChange,
  onBeginEdit,
}: {
  report: VisualQaReport;
  isEditing: boolean;
  lockFields?: boolean;
  diag: string;
  keyText: string;
  keyImagingText: string;
  reflectiveText: string;
  onDiagChange: (value: string) => void;
  onKeyTextChange: (value: string) => void;
  onKeyImagingChange: (value: string) => void;
  onReflectiveChange: (value: string) => void;
  onBeginEdit: () => void;
}) {
  if (!isEditing) {
    return <ReportSections report={report} />;
  }

  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Answer / explanation
        </h4>
        <div className="rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...markdownExternalLinkComponents }}>
            {report.answerText || '—'}
          </ReactMarkdown>
        </div>
      </section>

      <section className="rounded-xl border border-border-color bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Suggested diagnosis
          </h4>
          <button
            type="button"
            onClick={onBeginEdit}
            disabled={lockFields}
            className="text-xs font-medium text-text-muted hover:text-text-main disabled:cursor-not-allowed disabled:opacity-50"
          >
            Editing
          </button>
        </div>
        <textarea
          value={diag}
          onChange={(e) => onDiagChange(e.target.value)}
          rows={4}
          disabled={lockFields}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-base font-semibold text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </section>

      <section className="rounded-xl border border-border-color bg-surface p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Key findings
        </h4>
        <textarea
          value={keyText}
          onChange={(e) => onKeyTextChange(e.target.value)}
          rows={8}
          disabled={lockFields}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="One key finding per line"
        />
      </section>

      <section className="rounded-xl border border-cyan-accent/25 bg-surface p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Key imaging findings (SEPS)
        </h4>
        <p className="mb-2 text-xs text-text-muted">
          Radiology-focused teaching points. Use line breaks or semicolons for separate bullets.
        </p>
        <textarea
          value={keyImagingText}
          onChange={(e) => onKeyImagingChange(e.target.value)}
          rows={6}
          disabled={lockFields}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="e.g. Cortical thickening along the diaphysis..."
        />
      </section>

      <section className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">
          Reflective questions (SEPS)
        </h4>
        <p className="mb-2 text-xs text-text-muted">
          Prompts for learner self-assessment before you resolve this case.
        </p>
        <textarea
          value={reflectiveText}
          onChange={(e) => onReflectiveChange(e.target.value)}
          rows={5}
          disabled={lockFields}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="What features would you look for on the next view?"
        />
      </section>
    </div>
  );
}
