'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { TriageWorkbenchSkeleton } from '@/components/shared/DashboardSkeletons';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';
import { getLecturerClasses, getStudentQuestions, rejectTriageAnswer } from '@/lib/api/lecturer';
import { http, getApiErrorMessage, resolveApiAssetUrl } from '@/lib/api/client';
import { respondToQuestion } from '@/lib/api/lecturer-triage';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassItem, LectStudentQuestionDto } from '@/lib/api/types';
import { RectangleAnnotationOverlay } from '@/components/shared/RectangleAnnotationOverlay';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';

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
  const raw = (item.answerStatus ?? '').trim();
  if (!raw) return false;
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    key === 'escalated' ||
    key === 'escalatedtoexpert' ||
    key === 'expertapproved'
  );
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

export default function QATriagePage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [questions, setQuestions] = useState<LectStudentQuestionDto[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [editStructuredDiagnosis, setEditStructuredDiagnosis] = useState('');
  const [editDifferentialDiagnoses, setEditDifferentialDiagnoses] = useState('');
  const [modifying, setModifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
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
    if (selectedTurnIndex == null) return selectedQuestion.turns[selectedQuestion.turns.length - 1];
    return selectedQuestion.turns.find((t) => t.turnIndex === selectedTurnIndex) ?? selectedQuestion.turns[selectedQuestion.turns.length - 1];
  }, [selectedQuestion, selectedTurnIndex]);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) return;
    void getLecturerClasses(userId)
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      })
      .catch(() => {
        toast.error('Unable to load your lecturer classes.');
      });
  }, [toast]);

  const loadQuestions = useCallback(async (classId: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getStudentQuestions(classId);
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
    const latestTurn = selectedQuestion.turns?.[selectedQuestion.turns.length - 1] ?? null;
    setSelectedTurnIndex(latestTurn?.turnIndex ?? null);
  }, [selectedQuestionId, selectedQuestion]);

  const handleEscalate = async (item: LectStudentQuestionDto) => {
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
      // `http` is the shared axios instance (base URL + auth).
      await http.put(`/api/lecturer/reviews/${encodeURIComponent(targetId)}/escalate`);
      setQuestions((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'lecturer' } : q)),
      );
      toast.success('Escalated successfully');
      if (selectedClassId) void loadQuestions(selectedClassId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
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

  const openModifyDialog = () => {
    if (!selectedQuestion) return;
    const latestAnswer = selectedQuestion.turns?.[selectedQuestion.turns.length - 1]?.answerText;
    setEditAnswerText(latestAnswer ?? selectedQuestion.answerText ?? '');
    setEditStructuredDiagnosis('');
    setEditDifferentialDiagnoses('');
    setModifyError(null);
    setShowModifyDialog(true);
  };

  const handleModifySubmit = async () => {
    if (!selectedQuestion || !selectedClassId || !editAnswerText.trim()) return;
    setModifying(true);
    setModifyError(null);
    try {
      await respondToQuestion(selectedClassId, selectedQuestion.id, {
        answerText: editAnswerText.trim(),
        structuredDiagnosis: editStructuredDiagnosis.trim() || undefined,
        differentialDiagnoses: editDifferentialDiagnoses.trim() || undefined,
        approve: false,
      });
      setShowModifyDialog(false);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? { ...q, answerText: editAnswerText.trim(), answerStatus: 'Edited' }
            : q,
        ),
      );
      toast.success('Changes saved.');
    } catch (e) {
      setModifyError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setModifying(false);
    }
  };

  const openRejectDialog = () => {
    setRejectReason('');
    setRejectError(null);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedQuestion) return;
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
          <div className="w-full max-w-sm">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {classes.length === 0 ? <option value="">No classes found</option> : null}
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.className} ({item.semester})
                </option>
              ))}
            </select>
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
            <section className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">Incoming Requests ({questions.length})</h2>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
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
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          Case {question.caseId.slice(0, 8).toUpperCase()}
                        </span>
                        {question.createdAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                            <Clock3 className="h-3 w-3" />
                            {new Date(question.createdAt).toLocaleString('vi-VN')}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              {!selectedQuestion ? null : (
                <>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected request</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedQuestion.studentName}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const pct = confidencePercent(selectedQuestion.aiConfidenceScore);
                        const badge = scoreLabel(selectedQuestion.aiConfidenceScore);
                        return pct != null ? (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badge.tone}`}
                          >
                            AI confidence: {pct}%
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            AI confidence: N/A (AI Failed)
                          </span>
                        );
                      })()}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {isEscalationBlockedByStatus(selectedQuestion)
                          ? 'Already escalated'
                          : 'Pending decision'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-border bg-muted/50 p-4">
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
                      <article className="overflow-hidden rounded-lg border border-border bg-muted/30 p-3">
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
                      <article className="rounded-lg border border-border bg-background p-4">
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
                    <article className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student question</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">{selectedQuestion.questionText}</p>
                    </article>

                    <article className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        AI Final Assessment (latest session turn)
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                        {(selectedQuestion.turns?.[selectedQuestion.turns.length - 1]?.answerText ||
                          selectedQuestion.answerText ||
                          '').trim() || 'No generated answer available.'}
                      </p>
                    </article>

                    <article className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case metadata</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {selectedQuestion.caseTitle || 'Untitled case'}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          Case ID: {selectedQuestion.caseId.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </article>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Edit the draft or escalate to expert clinical auditing. Direct approval is not available.
                    </p>
                    <div className="relative z-20 flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" onClick={openModifyDialog}>
                        <Edit3 className="h-4 w-4" />
                        Modify answer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
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
            </section>
          </div>
        )}
      </div>

      {showModifyDialog && selectedQuestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !modifying && setShowModifyDialog(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Edit3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">Modify AI answer</h3>
                    <p className="text-sm text-muted-foreground">Edit before saving. Escalate from the workbench when expert review is required.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={modifying}
                  onClick={() => setShowModifyDialog(false)}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[min(70vh,600px)] overflow-y-auto px-6 py-4">
              <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Student question</p>
                <p className="text-sm text-card-foreground">{selectedQuestion.questionText}</p>
              </div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Response text</label>
              <textarea
                value={editAnswerText}
                onChange={(e) => setEditAnswerText(e.target.value)}
                rows={6}
                className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Structured diagnosis</label>
              <input
                type="text"
                value={editStructuredDiagnosis}
                onChange={(e) => setEditStructuredDiagnosis(e.target.value)}
                className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Differential diagnoses</label>
              <textarea
                value={editDifferentialDiagnoses}
                onChange={(e) => setEditDifferentialDiagnoses(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              {modifyError ? <p className="mt-3 text-sm text-destructive">{modifyError}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setShowModifyDialog(false)} disabled={modifying}>
                Cancel
              </Button>
              <Button onClick={() => void handleModifySubmit()} disabled={modifying || !editAnswerText.trim()}>
                {modifying ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
                disabled={rejecting || !rejectReason.trim()}
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
