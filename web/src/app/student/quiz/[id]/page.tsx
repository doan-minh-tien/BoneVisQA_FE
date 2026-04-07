'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  Minus,
  BookOpen,
  PlayCircle,
  TrendingUp,
  AlertCircle,
  Timer,
  HelpCircle,
  UserRound,
  Contrast,
  Ruler,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAssignedQuizzes, startQuizSession, submitQuizSession } from '@/lib/api/student';
import { resolveApiAssetUrl } from '@/lib/api/client';
import type { StudentQuizResultDto } from '@/lib/api/types';
import type { AssignedQuizItem, QuizSessionDto, StudentSubmitQuestionDto } from '@/lib/api/types';

interface QuizModeQuestion {
  questionId: string;
  questionText: string;
  type: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  caseId?: string | null;
  caseTitle?: string | null;
  imageUrl?: string | null;
  explanation?: string;
  correctAnswer?: string;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 2.5];

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuizSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const toast = useToast();

  const [quizInfo, setQuizInfo] = useState<AssignedQuizItem | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [session, setSession] = useState<QuizSessionDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<StudentQuizResultDto | null>(null);

  const [zoomIndex, setZoomIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [highContrastImg, setHighContrastImg] = useState(false);
  const [straightenActive, setStraightenActive] = useState(false);

  const questions: QuizModeQuestion[] = session?.questions ?? [];
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const positionPct = totalQ > 0 ? Math.round(((currentIndex + 1) / totalQ) * 100) : 0;
  const moduleLabel = session?.topic ?? quizInfo?.className ?? 'Clinical module';

  useEffect(() => {
    (async () => {
      setLoadingInfo(true);
      try {
        const list = await getAssignedQuizzes();
        const found = list.find((q) => q.quizId === quizId);
        setQuizInfo(found ?? null);
      } catch {
        setQuizInfo(null);
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, [quizId]);

  useEffect(() => {
    if (!session || submitted) {
      setSecondsLeft(null);
      return;
    }
    const limitMin = quizInfo?.timeLimit;
    if (limitMin == null || limitMin <= 0) {
      setSecondsLeft(null);
      return;
    }
    const total = Math.round(limitMin * 60);
    setSecondsLeft(total);
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s != null && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, [session?.attemptId, quizInfo?.timeLimit, submitted, session]);

  const handleStart = async () => {
    setLoadingSession(true);
    try {
      const data = await startQuizSession(quizId);
      setSession(data);
      if (!data.questions || data.questions.length === 0) {
        toast.error('Quiz này không có câu hỏi nào. Vui lòng liên hệ giảng viên.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Không thể bắt đầu quiz: ${msg}`);
      console.error('[QuizSession] start error:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSelect = (option: string) => {
    if (submitted || showFeedback) return;
    setAnswers((prev) => ({ ...prev, [currentQ.questionId]: option }));
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((i) => i + 1);
      setShowFeedback(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowFeedback(false);
    }
  };

  const handleReveal = () => {
    if (!currentQ.correctAnswer) return;
    const selected = answers[currentQ.questionId];
    setAnswerStates((prev) => ({
      ...prev,
      [currentQ.questionId]:
        selected === currentQ.correctAnswer ? 'correct' : 'incorrect',
    }));
    setShowFeedback(true);
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const payload: StudentSubmitQuestionDto[] = Object.entries(answers).map(
        ([questionId, studentAnswer]) => ({ questionId, studentAnswer }),
      );
      const result = await submitQuizSession(session.attemptId, payload);
      setQuizResult(result);
      setSubmitted(true);
    } catch (e) {
      console.error('Submit failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const currentAnswer = currentQ ? answers[currentQ.questionId] : null;
  const currentState = currentQ ? (answerStates[currentQ.questionId] ?? 'unanswered') : 'unanswered';
  const isLast = currentIndex === totalQ - 1;
  const allAnswered = answeredCount === totalQ;

  // ---------- Loading quiz info ----------
  if (loadingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quizInfo && !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">Quiz not found</h1>
        <p className="text-muted-foreground">This quiz may no longer be available.</p>
        <Link href="/student/quiz">
          <Button>Back to quizzes</Button>
        </Link>
      </div>
    );
  }

  // ---------- Pre-start screen ----------
  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="w-full max-w-lg space-y-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-10 text-center shadow-lg shadow-primary/5">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-container text-white shadow-md shadow-primary/25">
            <PlayCircle className="h-8 w-8" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Assigned assessment</p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              {quizInfo?.quizName ?? 'Clinical Quiz'}
            </h1>
            {quizInfo?.className ? (
              <p className="mt-2 text-sm text-on-surface-variant">{quizInfo.className}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest/80 p-4">
            <div className="text-center">
              <p className="text-2xl font-black text-on-surface">{quizInfo?.totalQuestions ?? '—'}</p>
              <p className="text-xs font-medium text-on-surface-variant">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-on-surface">
                {quizInfo?.timeLimit != null ? `${quizInfo.timeLimit} min` : '—'}
              </p>
              <p className="text-xs font-medium text-on-surface-variant">Time limit</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            The live session timer starts when you begin. Use a stable connection and a quiet space.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => void handleStart()}
              isLoading={loadingSession}
              className="h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container text-base font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {!loadingSession && <PlayCircle className="h-5 w-5" />}
              {loadingSession ? 'Preparing…' : 'Begin assessment'}
            </Button>
            <Link href="/student/quiz">
              <Button variant="outline" className="h-12 w-full rounded-xl border-outline-variant/30 font-bold">
                <ArrowLeft className="h-4 w-4" />
                Back to quizzes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Quiz Mode ----------
  if (!currentQ || totalQ === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-on-surface-variant">This quiz has no questions.</p>
        <Link href="/student/quiz">
          <Button variant="outline">Back to quizzes</Button>
        </Link>
      </div>
    );
  }

  const questionTag =
    currentQ.type && currentQ.type.toLowerCase().includes('multiple')
      ? 'Multiple choice'
      : currentQ.type || 'Diagnostic analysis';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 bg-slate-50/95 px-4 py-4 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/95 sm:px-8 sm:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-headline text-lg font-extrabold tracking-tight text-primary sm:text-xl">
              Clinical Curator
            </h1>
            <p className="truncate text-xs font-medium text-on-surface-variant sm:text-sm">
              {quizInfo?.quizName ?? session.title}
            </p>
          </div>
          {!submitted && (
            <div className="hidden items-center rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1 sm:flex">
              <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-primary">Live session</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          {secondsLeft != null && !submitted ? (
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-headline text-sm font-bold tabular-nums text-primary dark:bg-slate-800 dark:text-blue-400">
              <Timer className="h-4 w-4 shrink-0" />
              {formatMmSs(secondsLeft)}
            </div>
          ) : null}
          <button
            type="button"
            className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high sm:block"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div
            className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-primary-container/15 sm:flex"
            title="Profile"
          >
            <UserRound className="h-5 w-5 text-primary" />
          </div>
          <Link
            href="/student/quiz"
            className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-8 lg:mb-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="mb-1 text-sm font-semibold text-on-surface-variant">Module: {moduleLabel}</p>
              <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">
                Question {currentIndex + 1} of {totalQ}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">{positionPct}%</span>
              <span className="ml-1 text-xs font-medium text-on-surface-variant">Complete</span>
              <p className="text-[11px] text-on-surface-variant">{answeredCount}/{totalQ} answered</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300"
              style={{ width: `${positionPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: image (template: 7 cols) */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-inverse-surface shadow-lg md:aspect-square">
                <div
                  className={`flex h-full w-full origin-center items-center justify-center overflow-hidden transition-transform duration-300 ${
                    highContrastImg ? 'contrast-125 saturate-125' : ''
                  }`}
                  style={{
                    transform: `scale(${ZOOM_LEVELS[zoomIndex]}) ${straightenActive ? 'rotate(-1deg)' : 'none'}`,
                  }}
                >
                  {currentQ.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveApiAssetUrl(currentQ.imageUrl)}
                      alt={currentQ.caseTitle ?? 'Case image'}
                      className="max-h-full max-w-full object-contain opacity-90 transition-opacity group-hover:opacity-100"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                          <BookOpen className="h-8 w-8 text-white/60" />
                        </div>
                        <p className="font-medium text-white/60">No image attached</p>
                      </div>
                    </div>
                  )}

                  {currentQ.imageUrl ? (
                    <>
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <ellipse
                          cx="50"
                          cy="55"
                          rx="10"
                          ry="7"
                          transform="rotate(-25, 50, 55)"
                          className="fill-secondary-container/15 stroke-secondary-container"
                          strokeWidth="0.6"
                        />
                      </svg>
                      <div className="pointer-events-none absolute left-[40%] top-[45%]">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full bg-secondary-container opacity-60" />
                          <div className="relative h-4 w-4 rounded-full border-2 border-white bg-secondary-container shadow-sm" />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-surface-container-lowest/80 p-2 shadow-2xl backdrop-blur-xl dark:bg-black/50">
                  <button
                    type="button"
                    onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))}
                    className="rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container-high dark:text-white/90 dark:hover:bg-white/10"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
                    className="rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container-high dark:text-white/90 dark:hover:bg-white/10"
                    title="Zoom out"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="mx-1 h-6 w-px bg-outline-variant/30 dark:bg-white/20" />
                  <button
                    type="button"
                    onClick={() => setHighContrastImg((v) => !v)}
                    className={`rounded-full p-2 transition-colors hover:bg-surface-container-high dark:hover:bg-white/10 ${
                      highContrastImg ? 'text-secondary dark:text-secondary-container' : 'text-on-surface dark:text-white/90'
                    }`}
                    title="Contrast"
                  >
                    <Contrast className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStraightenActive((v) => !v)}
                    className={`rounded-full p-2 font-bold transition-colors hover:bg-surface-container-high dark:hover:bg-white/10 ${
                      straightenActive ? 'text-secondary dark:text-secondary-container' : 'text-on-surface dark:text-white/90'
                    }`}
                    title="Straighten / align"
                  >
                    <Ruler className="h-5 w-5" />
                  </button>
                  <div className="mx-1 h-6 w-px bg-outline-variant/30 dark:bg-white/20" />
                  <button
                    type="button"
                    onClick={() => setZoomIndex(0)}
                    className="rounded-full px-2 py-1.5 font-headline text-xs font-bold text-on-surface hover:bg-surface-container-high dark:text-white/90 dark:hover:bg-white/10"
                    title="Reset zoom"
                  >
                    {ZOOM_LEVELS[zoomIndex]}×
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentQ.caseId ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                    <span className="font-bold text-on-surface">ID:</span> {currentQ.caseId.slice(0, 8)}
                  </span>
                ) : null}
                {currentQ.caseTitle ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    {currentQ.caseTitle}
                  </span>
                ) : null}
                {currentQ.type ? (
                  <span className="inline-flex items-center rounded-xl bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {currentQ.type}
                  </span>
                ) : null}
              </div>

              <div>
                <h4 className="mb-4 flex items-center gap-2 font-headline text-base font-bold text-on-surface">
                  <span className="h-1 w-6 rounded-full bg-primary" />
                  Reference material
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 transition-transform hover:-translate-y-0.5">
                    <BookOpen className="mb-3 h-7 w-7 text-primary" />
                    <p className="text-sm font-bold text-on-surface">Classification atlas</p>
                    <p className="mt-1 text-xs text-on-surface-variant">AO/OTA fracture classification systems</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 transition-transform hover:-translate-y-0.5">
                    <PlayCircle className="mb-3 h-7 w-7 text-primary" />
                    <p className="text-sm font-bold text-on-surface">Diagnostic video</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Clinical signs in emergency radiography</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5 transition-transform hover:-translate-y-0.5">
                    <TrendingUp className="mb-3 h-7 w-7 text-primary" />
                    <p className="text-sm font-bold text-on-surface">Success rate</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Track your progress after each attempt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: question + answers (template: 5 cols) */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 sm:p-8">
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {questionTag}
              </span>
              <p className="font-headline text-lg font-bold leading-snug text-on-surface sm:text-xl">
                {currentQ.questionText}
              </p>
            </div>

            <div className="space-y-4">
              {(
                [
                  { key: 'A' as const, text: currentQ.optionA },
                  { key: 'B' as const, text: currentQ.optionB },
                  { key: 'C' as const, text: currentQ.optionC },
                  { key: 'D' as const, text: currentQ.optionD },
                ] as const
              ).map(({ key, text }) => {
                if (!text) return null;
                const isSelected = currentAnswer === key;
                const state = currentState;
                const isCorrect = currentQ.correctAnswer === key;

                let row =
                  'border-outline-variant/15 bg-surface-container-lowest hover:border-primary/30 hover:bg-primary/5';
                let letter =
                  'bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-white';
                if (state !== 'unanswered' && isCorrect) {
                  row = 'border-2 border-success/50 bg-success/10';
                  letter = 'bg-success text-white';
                } else if (state === 'incorrect' && isSelected) {
                  row = 'border-2 border-destructive/50 bg-destructive/10';
                  letter = 'bg-destructive text-white';
                } else if (isSelected && state === 'unanswered') {
                  row = 'border-2 border-primary bg-primary/10';
                  letter = 'bg-primary text-white';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={submitted}
                    onClick={() => handleSelect(key)}
                    className={`group flex w-full items-center rounded-xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${row}`}
                  >
                    <span
                      className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${letter}`}
                    >
                      {key}
                    </span>
                    <span
                      className={`flex-1 font-semibold text-on-surface ${isSelected && state === 'unanswered' ? 'font-bold' : ''}`}
                    >
                      {text}
                    </span>
                    {state === 'unanswered' && isSelected ? (
                      <CheckCircle2 className="ml-2 h-6 w-6 shrink-0 text-primary" />
                    ) : null}
                    {state !== 'unanswered' && isCorrect ? (
                      <CheckCircle2 className="ml-2 h-6 w-6 shrink-0 text-success" />
                    ) : null}
                    {state === 'incorrect' && isSelected && !isCorrect ? (
                      <XCircle className="ml-2 h-6 w-6 shrink-0 text-destructive" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {!submitted ? (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={!currentAnswer || showFeedback}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high py-3.5 font-bold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Check answer
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-high py-4 font-bold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Previous
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={submitting || !allAnswered}
                      className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : allAnswered ? (
                        'Submit quiz'
                      ) : (
                        `${answeredCount}/${totalQ} answered`
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Next question
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {showFeedback ? (
              <div
                className={`rounded-2xl border p-6 sm:p-8 ${
                  currentState === 'correct'
                    ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/30'
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  {currentState === 'correct' ? (
                    <>
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      <span className="font-headline text-lg font-bold text-emerald-800 dark:text-emerald-200">
                        Correct
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-7 w-7 text-amber-600" />
                      <span className="font-headline text-lg font-bold text-amber-800 dark:text-amber-200">
                        Incorrect
                      </span>
                    </>
                  )}
                </div>
                {currentQ.explanation ? (
                  <p className="text-sm leading-relaxed text-on-surface-variant">{currentQ.explanation}</p>
                ) : null}
                {currentState === 'incorrect' && currentQ.correctAnswer ? (
                  <p className="mt-3 text-sm font-semibold text-on-surface">
                    Correct answer:{' '}
                    <span className="text-success">
                      {currentQ.correctAnswer}.{' '}
                      {String(currentQ[`option${currentQ.correctAnswer}` as keyof QuizModeQuestion] ?? '')}
                    </span>
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex < totalQ - 1) handleNext();
                  }}
                  className="mt-5 flex items-center gap-2 text-sm font-bold text-primary transition-transform hover:translate-x-1"
                >
                  {currentIndex < totalQ - 1 ? (
                    <>
                      Next question
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    'Review your answers below'
                  )}
                </button>
              </div>
            ) : null}

            {submitted && quizResult ? (
              <div className="space-y-6 rounded-2xl border border-primary/25 bg-primary/5 p-8">
                <div>
                  <p className="text-center font-headline text-lg font-bold text-on-surface">Quiz submitted</p>
                  <p className="mt-1 text-center text-sm text-on-surface-variant">
                    {answeredCount}/{totalQ} questions answered
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low/80 p-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-primary">
                      {quizResult.score != null ? `${Math.round(quizResult.score)}%` : '—'}
                    </p>
                    <p className="text-xs text-on-surface-variant">Your score</p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-3xl font-black ${quizResult.passed ? 'text-success' : 'text-destructive'}`}
                    >
                      {quizResult.passed ? 'PASSED' : 'RETRY'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {quizResult.correctAnswers}/{quizResult.totalQuestions} correct
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/student/quiz">
                    <Button variant="outline" className="rounded-xl font-bold">
                      Back to quizzes
                    </Button>
                  </Link>
                  <Link href="/student/history">
                    <Button className="rounded-xl font-bold">View history</Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 border-t border-outline-variant/10 pt-10">
          <h4 className="mb-4 flex items-center gap-2 font-headline text-base font-bold text-on-surface">
            <span className="h-1 w-6 rounded-full bg-primary" />
            Question navigator
          </h4>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const state = answerStates[q.questionId];
              const isCurrent = i === currentIndex;
              let cls = 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant';
              if (state === 'correct') cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600';
              else if (state === 'incorrect') cls = 'border-destructive/40 bg-destructive/10 text-destructive';
              else if (answers[q.questionId]) cls = 'border-primary/40 bg-primary/10 text-primary';
              if (isCurrent) cls += ' ring-2 ring-primary ring-offset-2 ring-offset-background';
              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(i);
                    setShowFeedback(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${cls}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-outline-variant/10 px-6 py-8 text-center">
        <p className="mx-auto max-w-2xl text-xs font-medium text-on-surface-variant">
          BoneVisQA uses high-fidelity educational imaging models. Terminology aligns with common orthopedic teaching
          standards; not a substitute for clinical supervision.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/student/quiz" className="text-xs font-bold text-on-surface-variant hover:text-primary">
            Back to quizzes
          </Link>
          <Link href="/student/history" className="text-xs font-bold text-on-surface-variant hover:text-primary">
            History
          </Link>
        </div>
      </footer>
    </div>
  );
}
