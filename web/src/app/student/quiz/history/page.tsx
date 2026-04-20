'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudentAppChrome, StudentDashboardFab } from '@/components/student/StudentAppChrome';
import { fetchStudentQuizHistory, fetchQuizAttemptReview } from '@/lib/api/student';
import type { StudentQuizAttemptSummary, QuizAttemptReview } from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import {
  BarChart3,
  BotMessageSquare,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';

type FilterMode = 'all' | 'ai' | 'assigned';

export default function StudentQuizHistoryPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [attempts, setAttempts] = useState<StudentQuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Review panel state
  const [reviewLoading, setReviewLoading] = useState(false);
  const [currentReview, setCurrentReview] = useState<QuizAttemptReview | null>(null);
  const [reviewActive, setReviewActive] = useState(false);

  // Auto-expand + load review when ?review=<attemptId> is present
  useEffect(() => {
    const reviewId = searchParams.get('review');
    if (reviewId) {
      setExpanded(reviewId);
      // Load and show review automatically
      setReviewLoading(true);
      fetchQuizAttemptReview(reviewId)
        .then((data) => {
          setCurrentReview(data);
          setReviewActive(true);
        })
        .catch(() => {
          toast.error('Failed to load review.');
        })
        .finally(() => {
          setReviewLoading(false);
        });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentQuizHistory();
        if (!cancelled) setAttempts(data);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Failed to load quiz history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    if (filter === 'ai') return attempts.filter((a) => a.isAiGenerated);
    if (filter === 'assigned') return attempts.filter((a) => !a.isAiGenerated);
    return attempts;
  }, [attempts, filter]);

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.completedAt);
    const aiAttempts = attempts.filter((a) => a.isAiGenerated);
    const scores = completed.map((a) => a.score ?? 0).filter((s) => s > 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return {
      total: attempts.length,
      completed: completed.length,
      ai: aiAttempts.length,
      avgScore: avg,
    };
  }, [attempts]);

  function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function scoreColor(score?: number | null): string {
    if (score == null) return 'text-[#424752]';
    if (score >= 80) return 'text-[#006a68]';
    if (score >= 60) return 'text-[#924e00]';
    return 'text-[#ba1a1a]';
  }

  function optionLabel(key: string) {
    const map: Record<string, string> = { A: 'A', B: 'B', C: 'C', D: 'D' };
    return map[key] ?? key;
  }

  function optionValue(q: {
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
  }, key: string) {
    return q[`option${key}` as keyof typeof q] as string | undefined;
  }

  // Load review handler
  const openReview = async (attemptId: string) => {
    setReviewLoading(true);
    try {
      const data = await fetchQuizAttemptReview(attemptId);
      setCurrentReview(data);
      setReviewActive(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load review.');
    } finally {
      setReviewLoading(false);
    }
  };

  // ReviewAnswersPanel component (inline to avoid moving complex JSX)
  function ReviewAnswersPanel({
    review,
    onClose,
  }: {
    review: QuizAttemptReview;
    onClose: () => void;
  }) {
    const [expanded, setExpanded] = useState<string | null>(null);
    return (
      <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eceef0] px-6 py-4">
          <div>
            <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e]">Review Answers</h3>
            <p className="text-sm text-[#424752]">{review.quizTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[#00478d] px-4 py-2 text-sm font-bold text-white"
          >
            <CheckCircle className="h-4 w-4" /> Done
          </button>
        </div>
        {/* Summary bar */}
        <div className="flex items-center gap-6 border-b border-[#eceef0] px-6 py-3 text-sm">
          <span className="font-semibold text-[#191c1e]">
            {review.score != null ? `${review.correctAnswers}/${review.totalQuestions}` : '—'}
          </span>
          <span className="text-[#727783]">
            {review.score != null ? `${Math.round(review.score)}%` : '—'}
          </span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
            review.passed
              ? 'bg-[#006a68]/10 text-[#006a68]'
              : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
          }`}>
            {review.passed ? 'Passed' : 'Not Passed'}
          </span>
        </div>
        {/* Questions */}
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
          {review.questions.map((q, i) => {
            const isExpanded = expanded === q.questionId;
            return (
              <div
                key={q.questionId}
                className={`rounded-xl border p-4 transition-all ${
                  q.isCorrect
                    ? 'border-[#006a68]/30 bg-[#94efec]/10'
                    : 'border-[#ba1a1a]/30 bg-[#f8d7da]/10'
                }`}
              >
                {/* Question header */}
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : q.questionId)}
                >
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    q.isCorrect
                      ? 'bg-[#006a68] text-white'
                      : 'bg-[#ba1a1a] text-white'
                  }`}>
                    {q.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#191c1e]">
                      <span className="mr-2 text-xs text-[#727783]">Q{i + 1}.</span>
                      {q.questionText}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="font-semibold">Your answer: </span>
                      <span className={q.isCorrect ? 'text-[#006a68]' : 'text-[#ba1a1a]'}>
                        {q.studentAnswer
                          ? `${optionLabel(q.studentAnswer)}. ${optionValue(q, q.studentAnswer) ?? ''}`
                          : <span className="italic text-[#727783]">No answer</span>}
                      </span>
                      {!q.isCorrect && q.correctAnswer && (
                        <span className="ml-3">
                          <span className="font-semibold text-[#727783]">Correct: </span>
                          <span className="text-[#006a68]">
                            {optionLabel(q.correctAnswer)}. {optionValue(q, q.correctAnswer) ?? ''}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className={`mt-1 h-4 w-4 shrink-0 text-[#727783] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                {/* Expanded: all options */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 pl-9">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const val = optionValue(q, key);
                      if (!val) return null;
                      const isSelected = q.studentAnswer === key;
                      const isCorrect = q.correctAnswer === key;
                      let cls = 'bg-white border-[#eceef0]';
                      if (isCorrect) cls = 'border-[#006a68] bg-[#94efec]/20 text-[#006a68]';
                      else if (isSelected && !isCorrect) cls = 'border-[#ba1a1a] bg-[#f8d7da]/20 text-[#ba1a1a]';
                      return (
                        <div key={key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}>
                          <span className="w-5 shrink-0 font-bold">{key}.</span>
                          <span className="flex-1">{val}</span>
                          {isCorrect && <CheckCircle className="h-4 w-4 shrink-0" />}
                          {isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#191c1e]">
      <StudentAppChrome
        breadcrumb="Quizzes"
        title="Quiz History"
        subtitle="Review all your quiz attempts including AI-generated practice quizzes"
      />

      <div className="px-6 pb-16 pt-6 md:px-10">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#c2c6d4]/30 bg-white">
            <div className="flex items-center gap-3 text-sm text-[#424752]">
              <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
              Loading quiz history…
            </div>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Total Attempts</p>
                <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#191c1e]">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Completed</p>
                <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#006a68]">{stats.completed}</p>
              </div>
              <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Practice Quizzes</p>
                <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#924e00]">{stats.ai}</p>
              </div>
              <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Avg Score</p>
                <p className={`mt-1 font-['Manrope',sans-serif] text-3xl font-black ${scoreColor(stats.avgScore)}`}>
                  {stats.avgScore != null ? `${Math.round(stats.avgScore)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#424752]">
                <Filter className="h-3.5 w-3.5" />
                Filter:
              </div>
              {([
                ['all', 'All'],
                ['ai', 'Practice Quizzes'],
                ['assigned', 'Assigned'],
              ] as [FilterMode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilter(val)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    filter === val
                      ? 'bg-[#00478d] text-white'
                      : 'border border-[#c2c6d4]/40 bg-white text-[#424752] hover:bg-[#f2f4f6]'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-xs text-[#727783]">
                {filtered.length} attempt{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center">
                <Trophy className="mx-auto h-10 w-10 text-[#727783]" />
                <h3 className="mt-4 text-lg font-semibold text-[#191c1e]">No quiz history yet</h3>
                <p className="mt-2 text-sm text-[#424752]">
                  {filter === 'ai'
                    ? 'You have not generated any AI practice quizzes yet.'
                    : 'Your completed quiz attempts will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white transition-all"
                  >
                    {/* Row */}
                    <div
                      className="flex cursor-pointer items-center justify-between p-5 hover:bg-[#f2f4f6]/50"
                      onClick={() => setExpanded(expanded === attempt.attemptId ? null : attempt.attemptId)}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            attempt.isAiGenerated
                              ? 'bg-[#ffdcc3]/30 text-[#703a00]'
                              : 'bg-[#d6e3ff] text-[#00478d]'
                          }`}
                        >
                          {attempt.isAiGenerated ? (
                            <BotMessageSquare className="h-5 w-5" />
                          ) : (
                            <Trophy className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold text-[#191c1e]">{attempt.quizTitle}</h3>
                            {attempt.isAiGenerated && (
                              <span className="shrink-0 rounded-full bg-[#ffdcc3] px-2 py-0.5 text-[10px] font-bold text-[#703a00]">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#727783]">
                            {attempt.topic && <span>{attempt.topic}</span>}
                            {attempt.difficulty && (
                              <span className="rounded bg-[#eceef0] px-1.5 py-0.5 text-[10px]">{attempt.difficulty}</span>
                            )}
                            {attempt.className && <span>{attempt.className}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(attempt.startedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {attempt.totalQuestions} Qs
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        {/* Score */}
                        {attempt.completedAt ? (
                          <div className="text-right">
                            {attempt.score != null ? (
                              <>
                                <p className={`text-xl font-black ${scoreColor(attempt.score)}`}>
                                  {attempt.correctAnswers}/{attempt.totalQuestions}
                                </p>
                                <p className="text-xs text-[#727783]">
                                  {Math.round(attempt.score)}%
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-[#727783]">Submitted</p>
                            )}
                          </div>
                        ) : (
                          <span className="rounded-full bg-[#ffdcc3]/40 px-3 py-1 text-xs font-semibold text-[#703a00]">
                            In Progress
                          </span>
                        )}

                        {/* Status badge */}
                        {attempt.completedAt ? (
                          attempt.passed ? (
                            <CheckCircle className="h-5 w-5 text-[#006a68]" />
                          ) : (
                            <XCircle className="h-5 w-5 text-[#ba1a1a]" />
                          )
                        ) : (
                          <RotateCcw className="h-5 w-5 text-[#727783]" />
                        )}

                        <ChevronRight
                          className={`h-4 w-4 text-[#727783] transition-transform ${
                            expanded === attempt.attemptId ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded: detail card */}
                    {expanded === attempt.attemptId && (
                      <div className="border-t border-[#eceef0] p-5">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Started</p>
                            <p className="mt-1 text-sm font-semibold">{formatDate(attempt.startedAt)}</p>
                          </div>
                          <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Completed</p>
                            <p className="mt-1 text-sm font-semibold">{formatDate(attempt.completedAt)}</p>
                          </div>
                          <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Passing Score</p>
                            <p className="mt-1 text-sm font-semibold">
                              {attempt.passingScore != null ? `${attempt.passingScore}%` : '—'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Result</p>
                            <p className={`mt-1 flex items-center justify-center gap-1 text-sm font-bold ${
                              attempt.passed ? 'text-[#006a68]' : 'text-[#ba1a1a]'
                            }`}>
                              {attempt.passed ? (
                                <><CheckCircle className="h-4 w-4" /> Passed</>
                              ) : (
                                <><XCircle className="h-4 w-4" /> Retry</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {attempt.completedAt && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void openReview(attempt.attemptId);
                              }}
                              disabled={reviewLoading && expanded === attempt.attemptId}
                              className="flex items-center gap-2 rounded-xl border border-[#00478d]/30 bg-[#d6e3ff]/20 px-4 py-2 text-xs font-bold text-[#00478d] transition-colors hover:bg-[#d6e3ff]/40 disabled:opacity-50"
                            >
                              {reviewLoading && expanded === attempt.attemptId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              Review Answers
                            </button>
                          )}
                          {attempt.isAiGenerated && attempt.completedAt && (
                            <a
                              href={`/student/quiz?regenerate=${encodeURIComponent(attempt.topic ?? attempt.quizTitle)}`}
                              className="flex items-center gap-2 rounded-xl border border-[#924e00]/30 bg-[#ffdcc3]/20 px-4 py-2 text-xs font-bold text-[#703a00] transition-colors hover:bg-[#ffdcc3]/40"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Regenerate this topic
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Answers Panel Overlay */}
      {reviewActive && currentReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <ReviewAnswersPanel
              review={currentReview}
              onClose={() => setReviewActive(false)}
            />
          </div>
        </div>
      )}

      <StudentDashboardFab />
    </div>
  );
}
