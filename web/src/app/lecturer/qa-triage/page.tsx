'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { AlertCircle, CheckCircle2, Clock3, Loader2, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getStudentQuestions } from '@/lib/api/lecturer';
import { escalateToExpert, TRIAGE_ALREADY_ESCALATED } from '@/lib/api/lecturer-triage';
import { getLecturerClasses } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassItem, LectStudentQuestionDto } from '@/lib/api/types';

function scoreLabel(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return { label: 'Unknown', tone: 'bg-slate-100 text-slate-600' };
  if (score >= 0.8) return { label: 'High confidence', tone: 'bg-emerald-100 text-emerald-700' };
  if (score >= 0.5) return { label: 'Medium confidence', tone: 'bg-amber-100 text-amber-700' };
  return { label: 'Low confidence', tone: 'bg-red-100 text-red-700' };
}

/** POST /api/lecturer/triage/{answerId}/escalate expects the answer row GUID, not the question id. */
function resolveEscalationAnswerId(item: LectStudentQuestionDto): string | null {
  const aid = item.answerId?.trim();
  return aid && aid.length > 0 ? aid : null;
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

  const selectedQuestion = useMemo(
    () => questions.find((item) => item.id === selectedQuestionId) ?? questions[0] ?? null,
    [questions, selectedQuestionId],
  );

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

  const handleEscalate = async (item: LectStudentQuestionDto) => {
    const routeAnswerId = resolveEscalationAnswerId(item);
    if (!routeAnswerId) {
      console.warn('[triage] escalate blocked: missing answerId', {
        questionId: item.id,
        answerId: item.answerId,
      });
      toast.error(
        'Cannot escalate: missing answer id from server. Refresh the page or contact support if this persists.',
      );
      return;
    }

    console.log('[triage] escalate POST /api/lecturer/triage/{answerId}/escalate', {
      answerId: routeAnswerId,
      questionId: item.id,
    });

    setEscalatingId(item.id);
    try {
      await escalateToExpert(routeAnswerId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'lecturer' } : q)),
      );
      toast.success('Escalated to clinical expert workbench.');
    } catch (error) {
      if (error instanceof Error && error.message === TRIAGE_ALREADY_ESCALATED) {
        toast.info('This case has already been escalated.');
        setQuestions((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, escalatedById: 'prior' } : q)),
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Escalation failed.');
      }
    } finally {
      setEscalatingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <Header
        title="Diagnostic triage"
        subtitle="Review class requests and escalate only what needs expert clinical auditing."
      />
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 pt-2 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-slate-600">
            Select a class, review the AI answer, then escalate when the case should reach the expert workbench.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Class</label>
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
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
            <h2 className="text-sm font-semibold text-slate-900">Incoming Requests ({questions.length})</h2>
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
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2 ring-offset-background'
                        : 'border-border bg-background hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-slate-900">
                        {question.questionText}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${score.tone}`}>
                        {score.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                        <User className="h-3 w-3" />
                        {question.studentName}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        Case {question.caseId.slice(0, 8).toUpperCase()}
                      </span>
                      {question.createdAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected request</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedQuestion.studentName}</h3>
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
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          AI confidence: —
                        </span>
                      );
                    })()}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {selectedQuestion.escalatedById ? 'Already escalated' : 'Pending decision'}
                    </span>
                  </div>
                </div>

                {confidencePercent(selectedQuestion.aiConfidenceScore) != null ? (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Model confidence</span>
                      <span>{confidencePercent(selectedQuestion.aiConfidenceScore)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-[width]"
                        style={{
                          width: `${confidencePercent(selectedQuestion.aiConfidenceScore)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Lower scores often warrant expert review before students rely on the answer.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <article className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student question</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-900">{selectedQuestion.questionText}</p>
                  </article>

                  <article className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI answer preview</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {selectedQuestion.answerText?.trim() || 'No generated answer available.'}
                    </p>
                  </article>

                  <article className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Case metadata</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {selectedQuestion.caseTitle || 'Untitled case'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        Case ID: {selectedQuestion.caseId.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </article>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    Escalation routes this request to expert clinical auditing.
                  </p>
                  <Button
                    type="button"
                    disabled={
                      Boolean(selectedQuestion.escalatedById) ||
                      escalatingId === selectedQuestion.id ||
                      !resolveEscalationAnswerId(selectedQuestion)
                    }
                    isLoading={escalatingId === selectedQuestion.id}
                    variant="primary"
                    className="!border-red-700 !bg-red-600 font-bold !text-white shadow-md hover:!bg-red-700 focus-visible:!ring-red-500"
                    onClick={() => void handleEscalate(selectedQuestion)}
                  >
                    <Send className="h-4 w-4" />
                    {selectedQuestion.escalatedById ? 'Escalated' : 'Escalate to Expert'}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      </div>
    </div>
  );
}
