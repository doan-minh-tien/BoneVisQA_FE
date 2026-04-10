'use client';

import { useEffect, useMemo, useState } from 'react';
import { StudentAppChrome, StudentDashboardFab } from '@/components/student/StudentAppChrome';
import { fetchStudentQuizHistory } from '@/lib/api/student';
import type { StudentQuizAttemptSummary } from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import {
  BarChart3,
  BotMessageSquare,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  RotateCcw,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';

type FilterMode = 'all' | 'ai' | 'assigned';

export default function StudentQuizHistoryPage() {
  const toast = useToast();
  const [attempts, setAttempts] = useState<StudentQuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

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
    return d.toLocaleDateString('vi-VN', {
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
                <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">AI Quizzes</p>
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
                ['ai', 'AI Quizzes'],
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
                                  {Math.round(attempt.score)}%
                                </p>
                                <p className="text-xs text-[#727783]">
                                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
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

                        <div className="mt-4 flex gap-3">
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

      <StudentDashboardFab />
    </div>
  );
}
