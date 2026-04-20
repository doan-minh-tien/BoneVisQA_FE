'use client';

import { useEffect, useMemo, useState } from 'react';
import { StudentAppChrome, StudentDashboardFab } from '@/components/student/StudentAppChrome';
import {
  deleteQuizAttempt,
  fetchQuizAttemptReview,
  fetchStudentClasses,
  fetchStudentQuizHistory,
  generateAndSaveAIPracticeQuiz,
  getAssignedQuizzes,
  submitAIPracticeQuiz,
} from '@/lib/api/student';
import type {
  AssignedQuizItem,
  QuizAttemptReview,
  StudentClassItem,
  StudentGeneratedQuizSession,
  StudentQuizAttemptSummary,
} from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import {
  BarChart3,
  BookOpen,
  BotMessageSquare,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  HelpCircle,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react';

const QUICK_TOPICS = [
  'Long Bone Fractures',
  'Spine Lesions',
  'Joint Diseases',
  'Bone Tumors',
  'Upper Extremity',
  'Lower Extremity',
];

// ── Sub-state: AI Quiz in-progress ──────────────────────────────────────────

type AIState = 'idle' | 'generating' | 'active' | 'submitting' | 'result';
type AIStateNarrow = Exclude<AIState, 'generating'>;

function scoreColor(s?: number | null) {
  if (s == null) return 'text-[#424752]';
  if (s >= 80) return 'text-[#006a68]';
  if (s >= 60) return 'text-[#924e00]';
  return 'text-[#ba1a1a]';
}

function optionLabel(key: string) {
  const map: Record<string, string> = { A: 'A', B: 'B', C: 'C', D: 'D' };
  return map[key] ?? key;
}

function optionValue(q: { optionA?: string | null; optionB?: string | null; optionC?: string | null; optionD?: string | null }, key: string) {
  return q[`option${key}` as keyof typeof q] as string | undefined;
}

function ReviewAnswersPanel({
  review,
  onClose,
  onRetake,
}: {
  review: QuizAttemptReview;
  onClose: () => void;
  onRetake?: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#eceef0] px-6 py-4">
        <div>
          <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e]">Review Answers</h3>
          <p className="text-sm text-[#424752]">
            {review.quizTitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRetake && (
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-2 rounded-xl border border-[#924e00]/30 bg-[#ffdcc3]/20 px-4 py-2 text-sm font-semibold text-[#703a00] hover:bg-[#ffdcc3]/40"
            >
              <RotateCcw className="h-4 w-4" /> Retake Quiz
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[#00478d] px-4 py-2 text-sm font-bold text-white"
          >
            <CheckCircle className="h-4 w-4" /> Done
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 border-b border-[#eceef0] px-6 py-3 text-sm">
        <span className="font-semibold text-[#191c1e]">
          {review.score != null ? `${Math.round(review.score)}%` : '—'}
        </span>
        <span className="text-[#727783]">
          {review.correctAnswers}/{review.totalQuestions} correct
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

export default function StudentQuizPage() {
  const toast = useToast();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [assignedQuizzes, setAssignedQuizzes] = useState<AssignedQuizItem[]>([]);
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filterTab, setFilterTab] = useState<'assigned' | 'practice' | 'history'>('assigned');
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('');

  const [historyAttempts, setHistoryAttempts] = useState<StudentQuizAttemptSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'ai' | 'assigned'>('all');
  const [historyExpanded, setHistoryExpanded] = useState<string | null>(null);

  // ── AI Quiz Flow ─────────────────────────────────────────────────────────
  const [showGenerator, setShowGenerator] = useState(false);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [aiSession, setAiSession] = useState<StudentGeneratedQuizSession | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiResult, setAiResult] = useState<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number } | null>(null);
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState('');

  // Review mode
  const [reviewLoading, setReviewLoading] = useState(false);
  const [currentReview, setCurrentReview] = useState<QuizAttemptReview | null>(null);
  const [reviewActive, setReviewActive] = useState(false);

  // ── Pagination (assigned quiz questions) ─────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [quizList, classList] = await Promise.all([getAssignedQuizzes(), fetchStudentClasses()]);
        if (!cancelled) {
          setAssignedQuizzes(quizList);
          setClasses(classList);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset review when switching tabs
  useEffect(() => {
    setReviewActive(false);
    setCurrentReview(null);
  }, [filterTab]);

  useEffect(() => {
    if (filterTab !== 'history') return;
    let cancelled = false;
    setHistoryLoading(true);
    fetchStudentQuizHistory()
      .then((rows) => {
        if (!cancelled) setHistoryAttempts(rows);
      })
      .catch(() => {
        if (!cancelled) setHistoryAttempts([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterTab]);

  const historyStats = useMemo(() => {
    const total = historyAttempts.length;
    const completed = historyAttempts.filter((a) => Boolean(a.completedAt)).length;
    const ai = historyAttempts.filter((a) => a.isAiGenerated).length;
    const scored = historyAttempts.filter((a) => a.completedAt != null && a.score != null);
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length
        : null;
    return { total, completed, ai, avgScore };
  }, [historyAttempts]);

  const historyFiltered = useMemo(() => {
    return historyAttempts.filter((a) => {
      if (historyFilter === 'ai') return a.isAiGenerated;
      if (historyFilter === 'assigned') return !a.isAiGenerated;
      return true;
    });
  }, [historyAttempts, historyFilter]);

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

  const filteredQuizzes = useMemo(() => {
    return assignedQuizzes.filter((q) => {
      const matchSearch = !search || q.quizName.toLowerCase().includes(search.toLowerCase());
      const matchTopic = !filterTopic || (q.topic ?? '').toLowerCase().includes(filterTopic.toLowerCase());
      return matchSearch && matchTopic;
    });
  }, [assignedQuizzes, search, filterTopic]);

  // ── AI Generate + Save ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genTopic.trim()) {
      toast.error('Please select a topic.');
      return;
    }
    setAiState('generating');
    setAiResult(null);
    setAiSession(null);
    setAiAnswers({});
    setCurrentPage(1);
    try {
      const session = await generateAndSaveAIPracticeQuiz(genTopic, genCount, genDifficulty || undefined);
      if (!session.attemptId || session.attemptId === '00000000-0000-0000-0000-000000000000') {
        toast.info('AI could not generate questions. Try a different topic.');
        setAiState('idle');
        return;
      }
      setAiSession(session);
      setAiState('active');
      toast.success(`Created and saved quiz "${session.title}"! Start now.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate AI quiz.');
      setAiState('idle');
    }
  };

  const handleSubmitAI = async () => {
    if (!aiSession) return;
    setAiState('submitting');
    try {
      const answers = aiSession.questions.map((q: { questionId: string }) => ({
        questionId: q.questionId,
        studentAnswer: aiAnswers[q.questionId] ?? '',
      }));
      const result = await submitAIPracticeQuiz(aiSession.attemptId, answers);
      setAiResult(result);
      setAiState('result');
      toast.success(`Submitted! Score: ${Math.round(result.score)}%`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit answers.');
      setAiState('active');
    }
  };

  const handleResetAI = () => {
    setAiState('idle');
    setAiSession(null);
    setAiAnswers({});
    setAiResult(null);
    setCurrentPage(1);
    setShowGenerator(true);
    setReviewActive(false);
    setCurrentReview(null);
  };

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

  const goToAIPractice = () => {
    setFilterTab('practice');
    setShowGenerator(true);
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      await deleteQuizAttempt(attemptId);
      setHistoryAttempts((prev) => prev.filter((a) => a.attemptId !== attemptId));
      if (historyExpanded === attemptId) setHistoryExpanded(null);
      toast.success('Attempt removed from history.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete attempt.');
    }
  };

  const aiProgress = aiSession
    ? Math.round((aiSession.questions.filter((q) => aiAnswers[q.questionId]).length / aiSession.questions.length) * 100)
    : 0;

  const questions = aiSession?.questions ?? [];
  const pagedQuestion = questions[currentPage - 1];
  const totalPages = questions.length;

  return (
    <div className="min-h-screen text-[#191c1e]">
      <StudentAppChrome breadcrumb="Quizzes" />

      <div className="px-6 pb-16 pt-6 md:px-10">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#00478d]">Practice Hub</span>
            <h2 className="font-['Manrope',sans-serif] text-2xl font-extrabold tracking-tight md:text-3xl">Quiz Arena</h2>
            {classes.length > 0 && (
              <p className="mt-1 text-sm text-[#424752]">
                {classes.length} enrolled class{classes.length !== 1 ? 'es' : ''} —{' '}
                <a href="/student/classes" className="font-semibold text-[#00478d] hover:underline">View classes</a>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all opacity-50 cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              Practice Quizzes
            </button>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="mb-6 flex items-center gap-1 border-b border-[#c2c6d4]/30">
          {([
            ['assigned', 'Assigned Practice Quizzes', Trophy, assignedQuizzes.length] as const,
            ['practice', 'Practice Quizzes', BotMessageSquare, 0] as const,
            ['history', 'History', Clock, historyAttempts.filter((a) => a.completedAt).length] as const,
          ]).map(([key, label, Icon, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilterTab(key);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
                filterTab === key
                  ? 'border-b-2 border-[#00478d] text-[#00478d]'
                  : 'text-[#727783] hover:text-[#191c1e]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'assigned' && count > 0 && (
                <span className="ml-1 rounded-full bg-[#d6e3ff] px-2 py-0.5 text-[10px] font-bold text-[#00478d]">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Assigned Quizzes ── */}
        {filterTab === 'assigned' && (
          <>
            {/* Search */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <HelpCircle className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727783]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quizzes, classes…"
                  className="w-full rounded-full border border-[#c2c6d4]/50 bg-white py-2.5 pl-10 pr-4 text-sm text-[#191c1e] placeholder:text-[#727783] focus:outline-none focus:ring-2 focus:ring-[#00478d]/30"
                />
              </div>
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="rounded-xl border border-[#c2c6d4]/50 bg-white px-4 py-2.5 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d]/30"
              >
                <option value="">All topics</option>
                {QUICK_TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {(search || filterTopic) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setFilterTopic(''); }}
                  className="flex items-center gap-1 rounded-xl border border-[#c2c6d4]/50 bg-white px-4 py-2.5 text-sm text-[#424752] hover:bg-[#f2f4f6]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#c2c6d4]/30 bg-white">
                <div className="flex items-center gap-3 text-sm text-[#424752]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
                  Loading quizzes…
                </div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center">
                <Trophy className="mx-auto h-10 w-10 text-[#727783]" />
                <h3 className="mt-4 text-lg font-semibold text-[#191c1e]">No matching quizzes</h3>
                  <p className="mt-2 text-sm text-[#424752]">Try adjusting the filters or create an AI quiz to practice.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredQuizzes.map((quiz, index) => {
                  const diffLabel =
                    quiz.passingScore == null
                      ? null
                      : quiz.passingScore >= 60 ? 'Medium' : 'Hard';
                  const cardKey = `${quiz.quizId}-${quiz.classId || 'noclass'}-${index}`;

                  return (
                    <div
                      key={cardKey}
                      className="group rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 transition-all hover:border-[#00478d]/40 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00478d]/10">
                          <HelpCircle className="h-5 w-5 text-[#00478d]" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {quiz.isCompleted && (
                            <span className="rounded-full bg-[#006a68]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#006a68]">
                              ✓ Completed
                            </span>
                          )}
                          {diffLabel && (
                            <span className="rounded-full bg-[#ffdcc3]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#703a00]">
                              {diffLabel}
                            </span>
                          )}
                          {quiz.score != null && (
                            <span className="rounded-full bg-[#d6e3ff] px-2.5 py-0.5 text-[10px] font-bold text-[#00478d]">
                              {Math.round(quiz.score)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="mb-1 font-['Manrope',sans-serif] text-base font-bold text-[#191c1e] line-clamp-2">
                        {quiz.quizName}
                      </h3>
                      {quiz.className && (
                        <p className="mb-3 text-xs text-[#727783]">
                          <BookOpen className="inline h-3 w-3 mr-1" />{quiz.className}
                        </p>
                      )}

                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-[#424752]">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5" />{quiz.totalQuestions} questions
                        </div>
                        {quiz.timeLimit != null && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />{quiz.timeLimit} min
                          </div>
                        )}
                      </div>

                      {quiz.isCompleted ? (
                        <div className="flex items-center justify-between border-t border-[#eceef0] pt-3">
                          <span className="text-sm font-bold text-[#006a68]">
                            {quiz.score != null ? `Score: ${Math.round(quiz.score)}%` : 'Submitted'}
                          </span>
                          <div className="flex items-center gap-2">
                            {quiz.attemptId && (
                              <a
                                href={`/student/quiz/history?review=${quiz.attemptId}`}
                                className="flex items-center gap-1 text-sm font-bold text-[#006a68] hover:underline"
                              >
                                <Eye className="h-3.5 w-3.5" /> Review
                              </a>
                            )}
                            <a
                              href={`/student/quiz/${quiz.quizId}`}
                              className="flex items-center gap-1 text-sm font-bold text-[#00478d] hover:underline"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Retake
                            </a>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`/student/quiz/${quiz.quizId}`}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00478d] to-[#005eb8] py-2.5 text-sm font-bold text-white shadow transition-all hover:scale-[1.01] active:scale-95"
                        >
                          Start Quiz <ChevronRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── AI Quiz active / result ── */}
        {filterTab === 'practice' && (
          <>
            {/* AI Quiz Generator panel — inside AI tab, collapsible */}
            {showGenerator &&
              aiState !== 'active' &&
              aiState !== 'submitting' &&
              aiState !== 'result' && (
                <div className="mb-6 rounded-2xl border border-[#924e00]/25 bg-gradient-to-br from-[#ffdcc3]/25 to-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 shrink-0 text-[#703a00]" />
                      <div>
                        <h3 className="font-['Manrope',sans-serif] text-base font-bold text-[#703a00]">
                          Generate AI Practice Quiz
                        </h3>
                        <p className="text-xs text-[#424752]">
                          Select a topic → generate a quiz → start practicing. After submitting, view it in History.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGenerator(false)}
                      className="text-xs font-semibold text-[#727783] hover:text-[#191c1e]"
                    >
                      Collapse
                    </button>
                  </div>

                  {aiState === 'generating' ? (
                    <div className="flex items-center gap-3 py-6 text-sm text-[#703a00]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating questions…
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Topic</label>
                          <select
                            value={genTopic}
                            onChange={(e) => setGenTopic(e.target.value)}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
                            <option value="">Select a topic…</option>
                            {QUICK_TOPICS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Questions</label>
                          <select
                            value={genCount}
                            onChange={(e) => setGenCount(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
                            {[3, 5, 10, 15, 20].map((n) => (
                              <option key={n} value={n}>
                                {n} questions
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Difficulty</label>
                          <select
                            value={genDifficulty}
                            onChange={(e) => setGenDifficulty(e.target.value)}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
<option value="">All</option>
                      <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={!genTopic.trim()}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#703a00] to-[#924e00] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate &amp; Start
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            {aiState === 'idle' ? (
              <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-12 text-center">
                <Brain className="mx-auto h-10 w-10 text-[#703a00]" />
                <h3 className="mt-3 text-lg font-semibold text-[#191c1e]">Practice with AI</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#424752]">
                  Generate a quiz by topic, answer questions, then submit — your score will be saved to History.
                </p>
                {!showGenerator && (
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00478d] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#005eb8]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Open Generator
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Session header */}
                {aiSession && (
                  <div className="flex items-center justify-between rounded-2xl border border-[#924e00]/30 bg-[#ffdcc3]/20 p-4">
                    <div>
                      <p className="font-semibold text-[#703a00]">{aiSession?.title}</p>
                      <p className="text-xs text-[#703a00]/70">
                        {aiSession?.questions?.length} questions •{' '}
                        {aiSession?.topic ? `Topic: ${aiSession?.topic}` : 'AI-generated'}
                      </p>
                    </div>
                    {aiState === 'result' && (
                      <button
                        type="button"
                        onClick={handleResetAI}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#703a00] shadow-sm hover:bg-[#ffdcc3]"
                      >
                        <Plus className="h-4 w-4" /> New Quiz
                      </button>
                    )}
                  </div>
                )}

                {/* Result banner */}
                {aiState === 'result' && aiResult && (
                  <div className="rounded-2xl border border-[#006a68]/30 bg-[#94efec]/20 p-6">
                    <div className="mb-4 flex items-center gap-3">
                      {aiResult?.passed
                        ? <CheckCircle className="h-8 w-8 text-[#006a68]" />
                        : <XCircle className="h-8 w-8 text-[#ba1a1a]" />}
                      <div>
                        <h3 className={`text-2xl font-black ${scoreColor(aiResult?.score ?? undefined)}`}>
                          {Math.round(aiResult?.score ?? 0)}%
                        </h3>
                        <p className="text-sm text-[#424752]">
                          {aiResult?.correctAnswers}/{aiResult?.totalQuestions} correct —{' '}
                          {aiResult?.passed ? 'Passed' : 'Needs improvement'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => aiSession && openReview(aiSession.attemptId)}
                        disabled={reviewLoading}
                        className="flex items-center gap-2 rounded-xl border border-[#00478d]/30 bg-white px-4 py-2 text-sm font-semibold text-[#00478d] hover:bg-[#d6e3ff]"
                      >
                        {reviewLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Review Answers
                      </button>
                      {!aiResult?.passed && (
                        <button
                          type="button"
                          onClick={() => {
                            setGenTopic(aiSession?.topic ?? '');
                            handleResetAI();
                          }}
                          className="flex items-center gap-2 rounded-xl border border-[#924e00]/30 bg-white px-4 py-2 text-sm font-semibold text-[#703a00]"
                        >
                          <RotateCcw className="h-4 w-4" /> Try Again
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Answers Panel */}
                {reviewActive && currentReview && (
                  <ReviewAnswersPanel review={currentReview!} onClose={() => setReviewActive(false)} />
                )}

                {/* Questions */}
                {(aiState === 'active' || aiState === 'submitting') && aiSession && (
                  <>
                    {/* Progress bar */}
                    <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-[#424752]">
                        <span>Question {currentPage} / {totalPages}</span>
                        <span>{aiProgress}% completed</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#eceef0]">
                        <div
                          className="h-full rounded-full bg-[#924e00] transition-all"
                          style={{ width: `${aiProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Current question */}
                    {pagedQuestion && (
                      <div className="rounded-2xl border border-[#924e00]/30 bg-white p-6">
                        <div className="mb-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#924e00]">
                            Question {currentPage}
                          </p>
                          <h3 className="mt-2 font-['Manrope',sans-serif] text-lg font-semibold text-[#191c1e]">
                            {pagedQuestion.questionText}
                          </h3>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {(['A', 'B', 'C', 'D'] as const).map((key) => {
                            const val = pagedQuestion[`option${key}` as keyof typeof pagedQuestion] as string | undefined;
                            if (!val) return null;
                            const isSelected = aiAnswers[pagedQuestion.questionId] === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  setAiAnswers((prev) => ({ ...prev, [pagedQuestion.questionId]: key }))
                                }
                                className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                                  isSelected
                                    ? 'border-[#924e00] bg-[#ffdcc3]/30 text-[#703a00] ring-1 ring-[#924e00]/40'
                                    : 'border-[#c2c6d4]/40 bg-[#f2f4f6] text-[#191c1e] hover:border-[#924e00]/40'
                                }`}
                              >
                                <span className="mr-2 font-bold text-[#924e00]">{key}.</span>{val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 rounded-xl border border-[#c2c6d4]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#424752] hover:bg-[#f2f4f6] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>

                      {currentPage === totalPages ? (
                        <button
                          type="button"
                          onClick={handleSubmitAI}
                          disabled={aiState === 'submitting'}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006a68] to-[#00478d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          {aiState === 'submitting' ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                          ) : (
                            <><CheckCircle className="h-4 w-4" /> Submit</>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= totalPages}
                          className="flex items-center gap-2 rounded-xl bg-[#00478d] px-5 py-2.5 text-sm font-bold text-white shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Quiz History ── */}
        {filterTab === 'history' && (
          <>
            {historyLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#c2c6d4]/30 bg-white">
                <div className="flex items-center gap-3 text-sm text-[#424752]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
                  Loading history…
                </div>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Total</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#191c1e]">{historyStats.total}</p>
                  </div>
                  <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Completed</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#006a68]">{historyStats.completed}</p>
                  </div>
                  <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Practice Quizzes</p>
                    <p className="mt-1 font-['Manrope',sans-serif] text-3xl font-black text-[#924e00]">{historyStats.ai}</p>
                  </div>
                  <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#424752]">Avg Score</p>
                    <p className={`mt-1 font-['Manrope',sans-serif] text-3xl font-black ${scoreColor(historyStats.avgScore)}`}>
                      {historyStats.avgScore != null ? `${Math.round(historyStats.avgScore)}%` : '—'}
                    </p>
                  </div>
                </div>

                {/* Filter chips */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#424752]">
                    <Filter className="h-3.5 w-3.5" />
                  </div>
                  {([
                    ['all', 'All'],
                    ['ai', 'Practice Quizzes'],
                    ['assigned', 'Assigned'],
                  ] as [typeof historyFilter, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setHistoryFilter(val)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        historyFilter === val
                          ? 'bg-[#00478d] text-white'
                          : 'border border-[#c2c6d4]/40 bg-white text-[#424752] hover:bg-[#f2f4f6]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-[#727783]">
                    {historyFiltered.length} attempt{historyFiltered.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* List */}
                {historyFiltered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center">
                    <Trophy className="mx-auto h-10 w-10 text-[#727783]" />
                    <h3 className="mt-4 text-lg font-semibold text-[#191c1e]">No quiz history yet</h3>
                    <p className="mt-2 text-sm text-[#424752]">
                      {historyFilter === 'ai'
                        ? 'You have not created any practice quizzes yet. Try creating one in the "Practice Quizzes" tab.'
                        : 'Your submitted quizzes will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyFiltered.map((attempt) => (
                      <div
                        key={attempt.attemptId}
                        className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white transition-all"
                      >
                        <div
                          className="flex cursor-pointer items-center justify-between p-5 hover:bg-[#f2f4f6]/50"
                          onClick={() => setHistoryExpanded(
                            historyExpanded === attempt.attemptId ? null : attempt.attemptId
                          )}
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
                                historyExpanded === attempt.attemptId ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {historyExpanded === attempt.attemptId && (
                          <div className="border-t border-[#eceef0] p-5">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Started</p>
                                <p className="mt-1 text-sm font-semibold">{formatDate(attempt.startedAt)}</p>
                              </div>
                              <div className="rounded-xl bg-[#f2f4f6] p-4 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#727783]">Submitted at</p>
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
                                <><XCircle className="h-4 w-4" /> Not Passed</>
                                  )}
                                </p>
                              </div>
                            </div>

                            {attempt.completedAt && (
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => openReview(attempt.attemptId)}
                                  className="flex items-center gap-2 rounded-xl border border-[#00478d]/30 bg-white px-4 py-2 text-xs font-semibold text-[#00478d] hover:bg-[#d6e3ff]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Review Answers
                                </button>
                                {attempt.isAiGenerated && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGenTopic(attempt.topic ?? attempt.quizTitle);
                                      goToAIPractice();
                                    }}
                                    className="flex items-center gap-2 rounded-xl border border-[#924e00]/30 bg-[#ffdcc3]/20 px-4 py-2 text-xs font-semibold text-[#703a00] transition-colors hover:bg-[#ffdcc3]/40"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Retake Quiz
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttempt(attempt.attemptId)}
                                  className="ml-auto flex items-center gap-2 rounded-xl border border-[#ba1a1a]/30 bg-white px-4 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#f8d7da]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Review Answers Modal — shown when active, overlaid on the quiz card */}
            {reviewActive && currentReview && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
                {/* Modal container */}
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl mt-4 md:mt-8 mb-4">
                  <ReviewAnswersPanel
                    review={currentReview}
                    onClose={() => setReviewActive(false)}
                    onRetake={() => {
                      setGenTopic(currentReview.quizTitle.includes('AI Quiz') ? currentReview.quizTitle.replace('AI Quiz: ', '').replace(/( \(.+\)$)/, '') : currentReview.quizTitle);
                      setReviewActive(false);
                      goToAIPractice();
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Quick topic chips ── */}
        {!loading && filterTab === 'assigned' && (
          <div className="mt-8 rounded-2xl border border-[#c2c6d4]/30 bg-[#f8fafc] px-4 py-4 md:px-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#727783]">Quick practice by topic</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setGenTopic(topic);
                    goToAIPractice();
                  }}
                  className="rounded-full border border-[#00478d]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#00478d] shadow-sm transition-colors hover:bg-[#d6e3ff]/50"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <StudentDashboardFab />
    </div>
  );
}
