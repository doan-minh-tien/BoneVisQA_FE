'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  BookOpen,
  PlayCircle,
  TrendingUp,
  ChevronRight,
  AlertCircle,
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
  imageUrl?: string;
  explanation?: string;
  correctAnswer?: string;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 2.5];

export default function QuizSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

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

  const questions: QuizModeQuestion[] = session?.questions ?? [];
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const completionPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

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

  const handleStart = async () => {
    setLoadingSession(true);
    try {
      const data = await startQuizSession(quizId);
      setSession(data);
    } catch (e) {
      console.error(e);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
        <div className="w-full max-w-lg space-y-6 rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PlayCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
              Assigned assessment
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-card-foreground">
              {quizInfo?.quizName ?? 'Clinical Quiz'}
            </h1>
            {quizInfo?.className ? (
              <p className="mt-1 text-sm text-muted-foreground">{quizInfo.className}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-4">
            <div className="text-center">
              <p className="text-2xl font-black text-card-foreground">
                {quizInfo?.totalQuestions ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-card-foreground">
                {quizInfo?.timeLimit ?? '—'} min
              </p>
              <p className="text-xs text-muted-foreground">Time limit</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Once started, the timer begins. Make sure you are in a quiet environment.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => void handleStart()} isLoading={loadingSession} className="text-base px-6 py-3">
              {!loadingSession && <PlayCircle className="h-5 w-5" />}
              {loadingSession ? 'Preparing…' : 'Begin assessment'}
            </Button>
            <Link href="/student/quiz">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to list
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Quiz Mode ----------
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-card/90 px-6 backdrop-blur-md">
        <Link
          href="/student/quiz"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit
        </Link>
        <div className="h-4 w-px bg-border" />
        <p className="font-semibold text-sm text-card-foreground truncate max-w-[200px]">
          {quizInfo?.quizName ?? 'Quiz'}
        </p>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Question{' '}
            <span className="font-bold text-card-foreground">
              {currentIndex + 1}/{totalQ}
            </span>
          </span>
          <div className="w-32">
            <div className="flex justify-end text-xs font-medium text-muted-foreground mb-1">
              {completionPct}%
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: question + options */}
          <div className="col-span-12 lg:col-span-5 order-2 lg:order-1 flex flex-col gap-6">
            {/* Question card */}
            <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                Question {currentIndex + 1}
              </h2>
              <h3 className="font-headline text-xl font-bold leading-snug text-card-foreground">
                {currentQ.questionText}
              </h3>

              <div className="mt-6 space-y-3">
                {(
                  [
                    { key: 'A', text: currentQ.optionA },
                    { key: 'B', text: currentQ.optionB },
                    { key: 'C', text: currentQ.optionC },
                    { key: 'D', text: currentQ.optionD },
                  ] as const
                ).map(({ key, text }) => {
                  if (!text) return null;
                  const isSelected = currentAnswer === key;
                  const state = currentState;
                  const isCorrect = currentQ.correctAnswer === key;
                  let cls = 'bg-card border-border hover:border-primary/50 hover:bg-muted/50';
                  if (state !== 'unanswered' && isCorrect)
                    cls = 'bg-success/10 border-success/40 text-success';
                  else if (state === 'incorrect' && isSelected)
                    cls = 'bg-destructive/10 border-destructive/40 text-destructive';
                  else if (isSelected)
                    cls = 'bg-primary text-primary-foreground border-primary shadow-sm';

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelect(key)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${cls}`}
                    >
                      <span className="font-semibold text-base">
                        {key}. {text}
                      </span>
                      {state === 'unanswered' && isSelected && (
                        <span className="h-6 w-6 rounded-full border-2 border-current" />
                      )}
                      {state !== 'unanswered' && isCorrect && (
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                      )}
                      {state === 'incorrect' && isSelected && !isCorrect && (
                        <XCircle className="h-6 w-6 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {!submitted && (
                  <button
                    type="button"
                    onClick={handleReveal}
                    disabled={!currentAnswer || showFeedback}
                    className="flex-1 rounded-full border border-border bg-muted/50 py-3.5 font-bold text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Check answer
                  </button>
                )}
                <div className="flex gap-2 flex-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex-1 rounded-full border border-border py-3.5 text-sm font-bold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="mx-auto h-4 w-4" />
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={submitting || !allAnswered}
                      className="flex-[3] rounded-full bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
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
                      className="flex-[3] flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-bold transition-colors hover:bg-muted"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback card */}
            {showFeedback && (
              <div
                className={`rounded-[2rem] border p-8 ${
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
                {currentQ.explanation && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{currentQ.explanation}</p>
                )}
                {currentState === 'incorrect' && currentQ.correctAnswer && (
                  <p className="mt-3 text-sm font-semibold text-card-foreground">
                    Correct answer:{' '}
                    <span className="text-success">
                      {currentQ.correctAnswer}. {currentQ[`option${currentQ.correctAnswer}` as keyof QuizModeQuestion] as string}
                    </span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex < totalQ - 1) handleNext();
                  }}
                  className="mt-5 flex items-center gap-2 text-sm font-bold text-primary hover:translate-x-1 transition-transform"
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
            )}

            {/* Submitted result banner */}
            {submitted && quizResult && (
              <div className="rounded-[2rem] border border-primary/30 bg-primary/5 p-8 space-y-6">
                <div>
                  <p className="text-center font-headline text-lg font-bold text-card-foreground">
                    Quiz submitted
                  </p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {answeredCount}/{totalQ} questions answered
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-card/50 p-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-primary">
                      {quizResult.score != null ? `${Math.round(quizResult.score)}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Your score</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-3xl font-black ${quizResult.passed ? 'text-success' : 'text-destructive'}`}>
                      {quizResult.passed ? 'PASSED' : 'RETRY'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quizResult.correctAnswers}/{quizResult.totalQuestions} correct
                    </p>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <Link href="/student/quiz">
                    <Button variant="outline">Back to quizzes</Button>
                  </Link>
                  <Link href="/student/history">
                    <Button>View history</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: image + controls */}
          <div className="col-span-12 lg:col-span-7 order-1 lg:order-2">
            <div className="sticky top-24 space-y-6">
              {/* Image viewer */}
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl aspect-[4/5]">
                <div
                  className="h-full w-full overflow-hidden transition-transform duration-300"
                  style={{ transform: `scale(${ZOOM_LEVELS[zoomIndex]})` }}
                >
                  {currentQ.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveApiAssetUrl(currentQ.imageUrl)}
                      alt={currentQ.caseTitle ?? 'Case image'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                          <BookOpen className="h-8 w-8 text-white/60" />
                        </div>
                        <p className="text-white/60 font-medium">No image attached</p>
                      </div>
                    </div>
                  )}
                  {/* Annotation overlay (SVG ellipse marker) */}
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
                      className="stroke-cyan-300 fill-cyan-300/10"
                      strokeWidth="0.6"
                    />
                  </svg>
                  {/* Primary pathology marker */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_15px_#67e8f9]" />
                      <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-center text-xs font-bold text-white shadow-xl backdrop-blur-md">
                        PRIMARY PATHOLOGY
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viewer controls */}
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-2 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))}
                    className="rounded-full p-2.5 text-white/80 hover:bg-white/10 transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <div className="mx-1 h-5 w-px bg-white/20" />
                  <button
                    type="button"
                    onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
                    className="rounded-full p-2.5 text-white/80 hover:bg-white/10 transition-colors"
                    title="Zoom out"
                  >
                    <span className="text-base font-bold">−</span>
                  </button>
                  <div className="mx-1 h-5 w-px bg-white/20" />
                  <button
                    type="button"
                    onClick={() => setZoomIndex(0)}
                    className="rounded-full px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                    title="Reset"
                  >
                    {ZOOM_LEVELS[zoomIndex]}×
                  </button>
                </div>
              </div>

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-2">
                {currentQ.caseId && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span className="font-bold text-foreground">ID:</span> {currentQ.caseId.slice(0, 8)}
                  </span>
                )}
                {currentQ.caseTitle && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {currentQ.caseTitle}
                  </span>
                )}
                {currentQ.type && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {currentQ.type}
                  </span>
                )}
              </div>

              {/* Reference material cards */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 font-headline text-base font-bold text-card-foreground">
                  <span className="h-1 w-6 rounded-full bg-primary" />
                  Reference material
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1">
                    <BookOpen className="mb-3 h-7 w-7 text-primary" />
                    <p className="font-bold text-sm text-card-foreground">Classification atlas</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      AO/OTA fracture classification systems
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1">
                    <PlayCircle className="mb-3 h-7 w-7 text-primary" />
                    <p className="font-bold text-sm text-card-foreground">Diagnostic video</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Clinical signs in emergency radiography
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1">
                    <TrendingUp className="mb-3 h-7 w-7 text-primary" />
                    <p className="font-bold text-sm text-card-foreground">Success rate</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      85% pass rate on Module 3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div className="mt-12">
          <h4 className="mb-4 flex items-center gap-2 font-headline text-base font-bold text-card-foreground">
            <span className="h-1 w-6 rounded-full bg-primary" />
            Question navigator
          </h4>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const state = answerStates[q.questionId];
              const isCurrent = i === currentIndex;
              let cls = 'border-border bg-card text-muted-foreground';
              if (state === 'correct') cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600';
              else if (state === 'incorrect') cls = 'border-destructive/40 bg-destructive/10 text-destructive';
              else if (answers[q.questionId]) cls = 'border-primary/40 bg-primary/10 text-primary';
              if (isCurrent) cls += ' ring-2 ring-primary ring-offset-2';
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
      </main>

      <footer className="mt-12 border-t border-border py-8 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2024 BoneVisQA Clinical Education System
          </p>
          <div className="flex gap-6">
            <Link href="/student/quiz" className="text-xs font-bold text-muted-foreground hover:text-primary">
              Back to quizzes
            </Link>
            <Link href="/student/history" className="text-xs font-bold text-muted-foreground hover:text-primary">
              History
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
