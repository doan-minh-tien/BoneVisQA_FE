'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { TriageWorkbenchSkeleton } from '@/components/shared/DashboardSkeletons';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Send,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';
import {
  fetchLecturerVisualQaTriageQueue,
  getLecturerClasses,
  rejectTriageAnswer,
} from '@/lib/api/lecturer';
import { getApiErrorMessage, resolveApiAssetUrl } from '@/lib/api/client';
import { TRIAGE_ALREADY_ESCALATED, WORKFLOW_CONFLICT, respondToQuestion } from '@/lib/api/lecturer-triage';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassItem, LectStudentQuestionDto, LecturerTriageRequestKind } from '@/lib/api/types';
import { RectangleAnnotationOverlay } from '@/components/shared/RectangleAnnotationOverlay';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';
import type { VisualQaTurn } from '@/lib/api/types';
import { isEscalationBlocked } from '@/lib/visual-qa-workflow';

function scoreLabel(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) {
    return { label: 'N/A (AI Failed)', tone: 'bg-muted text-muted-foreground' };
  }
  if (score >= 0.8) return { label: 'High confidence', tone: 'bg-emerald-500/15 text-emerald-800' };
  if (score >= 0.5) return { label: 'Medium confidence', tone: 'bg-amber-500/15 text-amber-800' };
  return { label: 'Low confidence', tone: 'bg-red-500/15 text-red-800' };
}

/** Answer-row GUID for PUT /api/lecturer/reviews/{id}/escalate — never the question id. */
function resolveEscalationAnswerRowId(item: LectStudentQuestionDto): string | null {
  const a = item.answerId?.trim();
  if (a) return a;
  const c = item.caseAnswerId?.trim();
  if (c) return c;
  return null;
}

function hasAnswerIdForEscalateUi(item: LectStudentQuestionDto): boolean {
  return Boolean(item.answerId?.trim());
}

function triageStudyImageSrc(item: LectStudentQuestionDto): string {
  const raw = (item.imageUrl ?? item.customImageUrl ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return resolveApiAssetUrl(raw);
}

function isEscalationBlockedByStatus(item: LectStudentQuestionDto): boolean {
  if (item.escalatedById != null && String(item.escalatedById).trim() !== '') return true;
  return isEscalationBlocked(item.answerStatus ?? null);
}

function escalateButtonTitle(
  item: LectStudentQuestionDto,
  hasClassExpert: boolean,
): string | undefined {
  if (isEscalationBlockedByStatus(item)) return 'Already escalated or approved.';
  if (!hasAnswerIdForEscalateUi(item)) {
    return 'Cannot escalate: AI answer is missing or incomplete.';
  }
  if (!hasClassExpert) {
    return "No expert assigned to this class — escalation can still be sent. Assign an expert in class settings when possible.";
  }
  return undefined;
}

function confidencePercent(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  const pct = score <= 1 ? score * 100 : score;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/** BE: no catalog `caseId` ⇒ personal upload; trimmed empty string treated as personal. */
function triageRequestKind(item: LectStudentQuestionDto): LecturerTriageRequestKind {
  return item.caseId != null && item.caseId.trim() !== '' ? 'case-catalog' : 'adhoc-upload';
}

function shortCaseId(caseId: string | null): string {
  if (caseId == null) return '—';
  const t = caseId.trim();
  if (!t) return '—';
  return t.length <= 10 ? t.toUpperCase() : `${t.slice(0, 8).toUpperCase()}…`;
}

function resolveSelectedTurn(item: LectStudentQuestionDto | null): VisualQaTurn | null {
  if (!item?.turns || item.turns.length === 0) return null;
  const requestedReviewMessageId = item.requestedReviewMessageId?.trim();
  const selectedAssistantMessageId = item.selectedAssistantMessageId?.trim();
  const selectedUserMessageId = item.selectedUserMessageId?.trim();

  const matchedByMessage = item.turns.find((turn) => {
    const assistantId = turn.assistantMessageId?.trim();
    const userId = turn.userMessageId?.trim();
    if (selectedAssistantMessageId && assistantId && selectedAssistantMessageId === assistantId) return true;
    if (selectedUserMessageId && userId && selectedUserMessageId === userId) return true;
    if (requestedReviewMessageId) {
      if (assistantId && assistantId === requestedReviewMessageId) return true;
      if (userId && userId === requestedReviewMessageId) return true;
    }
    return false;
  });
  if (matchedByMessage) return matchedByMessage;
  return item.turns[item.turns.length - 1] ?? null;
}

function hasSelectedPairMismatch(item: LectStudentQuestionDto | null): boolean {
  if (!item?.turns || item.turns.length === 0) return false;
  const requestedReviewMessageId = item.requestedReviewMessageId?.trim();
  if (!requestedReviewMessageId) return false;
  const selected = resolveSelectedTurn(item);
  if (!selected) return true;
  const userId = selected.userMessageId?.trim();
  const assistantId = selected.assistantMessageId?.trim();
  const selectedUserMessageId = item.selectedUserMessageId?.trim();
  const selectedAssistantMessageId = item.selectedAssistantMessageId?.trim();

  if (selectedUserMessageId && userId && selectedUserMessageId !== userId) return true;
  if (selectedAssistantMessageId && assistantId && selectedAssistantMessageId !== assistantId) return true;

  if (
    requestedReviewMessageId &&
    requestedReviewMessageId !== userId &&
    requestedReviewMessageId !== assistantId
  ) {
    return true;
  }
  return false;
}

export default function QATriagePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [questions, setQuestions] = useState<LectStudentQuestionDto[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const selectedQuestion = useMemo(
    () => questions.find((item) => item.id === selectedQuestionId) ?? questions[0] ?? null,
    [questions, selectedQuestionId],
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const hasClassExpert = Boolean(selectedClass?.expertId?.trim());

  const selectedStudyImageSrc = useMemo(
    () => (selectedQuestion ? triageStudyImageSrc(selectedQuestion) : ''),
    [selectedQuestion],
  );

  const selectedTurn = useMemo(() => {
    if (!selectedQuestion?.turns || selectedQuestion.turns.length === 0) return null;
    const defaultTurn = resolveSelectedTurn(selectedQuestion);
    if (selectedTurnIndex == null) return defaultTurn;
    return selectedQuestion.turns.find((t) => t.turnIndex === selectedTurnIndex) ?? defaultTurn;
  }, [selectedQuestion, selectedTurnIndex]);
  const selectedPairMismatch = useMemo(
    () => hasSelectedPairMismatch(selectedQuestion),
    [selectedQuestion],
  );

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) return;
    void getLecturerClasses(userId)
      .then((data) => {
        setClasses(data);
        if (data.length === 0) return;
        const fromUrl = searchParams.get('classId')?.trim();
        const pick =
          fromUrl && data.some((c) => c.id === fromUrl) ? fromUrl : data[0].id;
        setSelectedClassId(pick);
      })
      .catch(() => {
        toast.error('Unable to load your lecturer classes.');
      });
  }, [toast, searchParams]);

  const loadQuestions = useCallback(async (classId: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchLecturerVisualQaTriageQueue(classId);
      setQuestions(data);
      setSelectedQuestionId(data[0]?.id ?? null);
      setSelectedTurnIndex(data[0]?.turns?.[data[0].turns.length - 1]?.turnIndex ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load triage queue.');
      setQuestions([]);
      setSelectedQuestionId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    void loadQuestions(selectedClassId);
  }, [selectedClassId, loadQuestions]);

  useEffect(() => {
    if (!selectedQuestion) {
      setSelectedTurnIndex(null);
      return;
    }
    const defaultTurn = resolveSelectedTurn(selectedQuestion);
    setSelectedTurnIndex(defaultTurn?.turnIndex ?? null);
  }, [selectedQuestionId, selectedQuestion]);

  const handleEscalate = async (item: LectStudentQuestionDto) => {
    if (hasSelectedPairMismatch(item)) {
      toast.error('Selected pair mismatch detected. Refresh queue data and try again.');
      return;
    }
    const targetId = resolveEscalationAnswerRowId(item);
    if (!targetId) {
      toast.error('Cannot escalate: AI answer is missing or incomplete.');
      return;
    }

    if (!hasClassExpert) {
      toast.info("No expert is assigned to this class — escalation will still be sent if the server accepts it.");
    }

    setEscalatingId(item.id);
    try {
      await respondToQuestion(selectedClassId, item.id, {
        answerText:
          item.turns?.find((turn) => {
            const assistantId = turn.assistantMessageId?.trim();
            const selectedAssistantId = item.selectedAssistantMessageId?.trim();
            const requestedReviewMessageId = item.requestedReviewMessageId?.trim();
            if (selectedAssistantId && assistantId === selectedAssistantId) return true;
            if (requestedReviewMessageId && assistantId === requestedReviewMessageId) return true;
            return false;
          })?.answerText?.trim() ||
          item.answerText?.trim() ||
          '',
        approve: true,
        decision: 'approve_and_escalate',
        requestedReviewMessageId: item.requestedReviewMessageId ?? null,
        selectedUserMessageId: item.selectedUserMessageId ?? null,
        selectedAssistantMessageId: item.selectedAssistantMessageId ?? null,
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'lecturer' } : q)),
      );
      toast.success('Escalated successfully');
      if (selectedClassId) void loadQuestions(selectedClassId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === TRIAGE_ALREADY_ESCALATED) {
        toast.info('This case has already been escalated.');
        setQuestions((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'prior' } : q)),
        );
      } else if (message === WORKFLOW_CONFLICT || (axios.isAxiosError(error) && error.response?.status === 409)) {
        toast.info('This case has already been escalated.');
        setQuestions((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'prior' } : q)),
        );
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setEscalatingId(null);
    }
  };

  const openRejectDialog = () => {
    setRejectReason('');
    setRejectError(null);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedQuestion) return;
    if (hasSelectedPairMismatch(selectedQuestion)) {
      setRejectError('Selected pair mismatch detected. Please reload queue data before rejecting.');
      return;
    }
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Please provide a rejection reason.');
      return;
    }
    const targetId = resolveEscalationAnswerRowId(selectedQuestion);
    if (!targetId) {
      setRejectError('Cannot reject: AI answer is missing or incomplete.');
      return;
    }
    setRejecting(true);
    setRejectError(null);
    try {
      await rejectTriageAnswer(targetId, reason);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id ? { ...q, answerStatus: 'Rejected' } : q,
        ),
      );
      setShowRejectDialog(false);
      toast.success('Answer rejected and feedback sent to student.');
      if (selectedClassId) void loadQuestions(selectedClassId);
    } catch (error) {
      setRejectError(getApiErrorMessage(error));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <Header
        title="Diagnostic triage"
        subtitle="Review class requests and escalate cases that need expert clinical auditing. Lecturers cannot approve AI answers directly."
      />
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 pt-2 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm text-muted-foreground">
              Select a class, review the AI answer, then escalate when the case should reach the expert workbench.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-sm">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Class
            </label>
            <div className="flex gap-2">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {classes.length === 0 ? <option value="">No classes found</option> : null}
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.className} ({item.semester})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                disabled={!selectedClassId || loading}
                title="Reload Visual QA triage queue"
                onClick={() => selectedClassId && void loadQuestions(selectedClassId)}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <TriageWorkbenchSkeleton />
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4" />
              {loadError}
            </div>
            <Button className="mt-4" onClick={() => selectedClassId && void loadQuestions(selectedClassId)}>
              Retry
            </Button>
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
            title="All caught up!"
            description="There are no cases requiring your attention right now for this class."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Incoming Requests ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[70vh] space-y-3 overflow-y-auto pt-0 pr-1">
                {questions.map((question) => {
                  const isSelected =
                    selectedQuestionId != null
                      ? selectedQuestionId === question.id
                      : selectedQuestion?.id === question.id;
                  const score = scoreLabel(question.aiConfidenceScore);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setSelectedQuestionId(question.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-blue-50 text-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'border-border bg-background hover:bg-muted/60'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-foreground">
                          {question.questionText}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${score.tone}`}>
                          {score.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                          <User className="h-3 w-3" />
                          {question.studentName}
                        </span>
                        <Badge
                          variant={
                            triageRequestKind(question) === 'case-catalog' ? 'secondary' : 'accent'
                          }
                          className="font-medium"
                        >
                          {triageWorkflowLabel(question)}
                        </Badge>
                        {question.caseId != null && question.caseId.trim() !== '' ? (
                          <span className="rounded-full bg-muted px-2 py-0.5" title={question.caseId}>
                            Case {shortCaseId(question.caseId)}
                          </span>
                        ) : null}
                        {question.createdAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                            <Clock3 className="h-3 w-3" />
                            {new Date(question.createdAt).toLocaleString('en-GB')}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-md shadow-black/[0.04]">
              {!selectedQuestion ? null : (
                <>
                  <CardHeader className="flex flex-col gap-4 border-b border-border/80 bg-muted/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                        Selected request
                      </CardDescription>
                      <CardTitle className="text-xl font-semibold">{selectedQuestion.studentName}</CardTitle>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge
                          variant={
                            triageRequestKind(selectedQuestion) === 'case-catalog'
                              ? 'secondary'
                              : 'accent'
                          }
                        >
                          {triageWorkflowLabel(selectedQuestion)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const pct = confidencePercent(selectedQuestion.aiConfidenceScore);
                        const badge = scoreLabel(selectedQuestion.aiConfidenceScore);
                        return pct != null ? (
                          <Badge className={badge.tone}>{`AI confidence: ${pct}%`}</Badge>
                        ) : (
                          <Badge variant="muted">AI confidence: N/A (AI Failed)</Badge>
                        );
                      })()}
                      <Badge variant="outline">
                        {isEscalationBlockedByStatus(selectedQuestion)
                          ? 'Already escalated'
                          : 'Pending decision'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-6">
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-4 shadow-inner">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>AI confidence score</span>
                      <span className="font-mono text-foreground">
                        {confidencePercent(selectedQuestion.aiConfidenceScore) != null
                          ? `${confidencePercent(selectedQuestion.aiConfidenceScore)}%`
                          : 'N/A (AI Failed)'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
                        style={{
                          width:
                            confidencePercent(selectedQuestion.aiConfidenceScore) != null
                              ? `${confidencePercent(selectedQuestion.aiConfidenceScore)}%`
                              : '0%',
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {confidencePercent(selectedQuestion.aiConfidenceScore) != null
                        ? 'Lower scores often warrant expert review before students rely on the answer.'
                        : 'The model did not return a confidence score for this answer. Escalate if clinical review is needed.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedStudyImageSrc ? (
                      <article className="overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-4 shadow-sm">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Student study image
                        </p>
                        <div className="relative mx-auto max-h-[min(420px,55vh)] w-full overflow-hidden rounded-md bg-black/80">
                          <div className="relative mx-auto w-fit">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedStudyImageSrc}
                              alt={`Study image for ${selectedQuestion.studentName}`}
                              className="mx-auto max-h-[min(420px,55vh)] w-auto max-w-full object-contain"
                              loading="lazy"
                            />
                            <RectangleAnnotationOverlay
                              closed={
                                selectedTurn?.roiBoundingBox && isValidNormalizedBoundingBox(selectedTurn.roiBoundingBox)
                                  ? selectedTurn.roiBoundingBox
                                  : null
                              }
                              draft={null}
                              label="Turn ROI"
                              className="drop-shadow-[0_0_8px_rgba(239,68,68,0.45)]"
                            />
                          </div>
                        </div>
                      </article>
                    ) : null}
                    {selectedQuestion.turns && selectedQuestion.turns.length > 0 ? (
                      <article className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Chat session context
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Select a turn to inspect its ROI. AI Final Assessment below uses the latest turn.
                        </p>
                        <ol className="mt-3 space-y-2">
                          {selectedQuestion.turns.slice(-3).map((turn) => (
                            <li key={turn.turnIndex}>
                              <button
                                type="button"
                                onClick={() => setSelectedTurnIndex(turn.turnIndex)}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                                  selectedTurn?.turnIndex === turn.turnIndex
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:bg-muted/40'
                                }`}
                              >
                                <p className="font-medium">Turn {turn.turnIndex}: {turn.questionText || '—'}</p>
                                <p className="mt-1 text-muted-foreground line-clamp-2">{turn.answerText || '—'}</p>
                              </button>
                            </li>
                          ))}
                        </ol>
                      </article>
                    ) : null}
                    <article className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student question</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {selectedTurn?.questionText?.trim() || selectedQuestion.questionText}
                      </p>
                    </article>

                    <article className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        AI Final Assessment (latest session turn)
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                        {(selectedTurn?.answerText ||
                          selectedQuestion.answerText ||
                          '').trim() || 'No generated answer available.'}
                      </p>
                    </article>

                    {selectedTurn &&
                    (selectedTurn.structuredDiagnosis?.trim() ||
                      selectedTurn.keyImagingFindings?.trim()) ? (
                      <article className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Structured assistant fields (selected turn)
                        </p>
                        {selectedTurn.structuredDiagnosis?.trim() ? (
                          <div className="mt-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Structured diagnosis
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                              {selectedTurn.structuredDiagnosis.trim()}
                            </p>
                          </div>
                        ) : null}
                        {selectedTurn.keyImagingFindings?.trim() ? (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Key imaging findings
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                              {selectedTurn.keyImagingFindings.trim()}
                            </p>
                          </div>
                        ) : null}
                      </article>
                    ) : null}

                    {selectedQuestion.caseId != null && selectedQuestion.caseId.trim() !== '' ? (
                      <article className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Case metadata (catalog snapshot)
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Catalog case chat —{' '}
                          {selectedQuestion.caseId.trim()
                            ? `Case ID: ${shortCaseId(selectedQuestion.caseId)}`
                            : 'Case ID pending sync.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                            {selectedQuestion.caseTitle.trim() || 'Untitled case'}
                          </span>
                          {(selectedQuestion.caseTags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {selectedQuestion.caseDescription?.trim() ? (
                          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                            {selectedQuestion.caseDescription.trim()}
                          </p>
                        ) : null}
                        {selectedQuestion.caseSuggestedDiagnosis?.trim() ? (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Case suggested diagnosis
                            </p>
                            <p className="mt-2 text-sm text-foreground/90">
                              {selectedQuestion.caseSuggestedDiagnosis.trim()}
                            </p>
                          </div>
                        ) : null}
                        {selectedQuestion.caseKeyFindings?.trim() ? (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Case key findings
                            </p>
                            <p className="mt-2 text-sm text-foreground/90">
                              {selectedQuestion.caseKeyFindings.trim()}
                            </p>
                          </div>
                        ) : null}
                      </article>
                    ) : null}
                    {selectedPairMismatch ? (
                      <article className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                          Selected pair mismatch
                        </p>
                        <p className="mt-2 text-sm text-amber-950">
                          The selected review message IDs no longer match this loaded turn after refresh/reload. Reload queue data before rejecting or escalating.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 border-amber-600 text-amber-900 hover:bg-amber-100"
                          disabled={!selectedClassId || loading}
                          onClick={() => selectedClassId && void loadQuestions(selectedClassId)}
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          Reload queue
                        </Button>
                      </article>
                    ) : null}
                  </div>
                  </CardContent>

                  <div className="flex flex-col gap-3 border-t border-border px-6 pb-6 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <div className="relative z-20 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        disabled={selectedPairMismatch}
                        onClick={openRejectDialog}
                      >
                        Reject
                      </Button>
                      <span
                        className="inline-flex max-w-full cursor-default"
                        title={
                          escalatingId === selectedQuestion.id
                            ? 'Sending escalation…'
                            : escalateButtonTitle(selectedQuestion, hasClassExpert)
                        }
                      >
                        <Button
                          type="button"
                          disabled={
                            escalatingId === selectedQuestion.id ||
                            selectedPairMismatch ||
                            isEscalationBlockedByStatus(selectedQuestion) ||
                            !hasAnswerIdForEscalateUi(selectedQuestion)
                          }
                          isLoading={escalatingId === selectedQuestion.id}
                          variant="primary"
                          className="pointer-events-auto !border-red-700 !bg-red-600 font-bold !text-white shadow-md hover:!bg-red-700 focus-visible:!ring-red-500"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleEscalate(selectedQuestion);
                          }}
                        >
                          <Send className="h-4 w-4" />
                          {isEscalationBlockedByStatus(selectedQuestion)
                            ? 'Escalated'
                            : 'Escalate to Expert'}
                        </Button>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
      {showRejectDialog && selectedQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !rejecting && setShowRejectDialog(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-card-foreground">Rejection reason</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Explain why this AI response is rejected so the student can improve.
              </p>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter rejection reason..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              />
              {rejectError ? <p className="mt-3 text-sm text-destructive">{rejectError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleRejectSubmit()}
                disabled={rejecting || !rejectReason.trim() || selectedPairMismatch}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {rejecting ? 'Submitting…' : 'Confirm reject'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
