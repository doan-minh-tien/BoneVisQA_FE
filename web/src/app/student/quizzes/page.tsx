'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { StudentPracticeQuizContent } from '@/components/student/StudentPracticeQuizContent';
import { useToast } from '@/components/ui/toast';
import { getAssignedQuizzes } from '@/lib/api/student';
import type { AssignedQuizItem } from '@/lib/api/types';
import { BookOpen, ClipboardList, Loader2, Sparkles, Timer } from 'lucide-react';

type QuizTab = 'assigned' | 'practice';

function formatDue(closeTime?: string | null, openTime?: string | null) {
  if (closeTime) {
    const d = new Date(closeTime);
    if (!Number.isNaN(d.getTime())) return `Closes ${d.toLocaleString()}`;
  }
  if (openTime) {
    const d = new Date(openTime);
    if (!Number.isNaN(d.getTime())) return `Opens ${d.toLocaleString()}`;
  }
  return 'Schedule set by your lecturer';
}

function AssignedPracticeQuizzesPanel() {
  const toast = useToast();
  const [items, setItems] = useState<AssignedQuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssignedQuizzes();
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load assigned quizzes.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading your class quizzes…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">No practice quizzes yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          When your lecturer assigns a quiz to one of your classes, it will appear here. You can still use Practice
          Quizzes to study on your own.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((q) => (
        <li
          key={`${q.classId}-${q.quizId}`}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Required
              </span>
              {q.isCompleted ? (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  Completed
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 font-semibold text-foreground">{q.quizName}</h3>
            <p className="text-sm text-muted-foreground">{q.className}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {q.totalQuestions || '—'} questions
              </span>
              {q.timeLimit != null ? (
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  {q.timeLimit} min
                </span>
              ) : null}
              {q.topic ? <span>Topic: {q.topic}</span> : null}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatDue(q.closeTime, q.openTime)}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {q.score != null ? (
              <span className="text-sm font-semibold text-foreground">Last score: {Math.round(q.score)}%</span>
            ) : null}
            <Link
              href={`/student/quiz/${q.quizId}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-white hover:opacity-95 sm:w-auto"
            >
              {q.isCompleted ? 'Review / retake' : 'Start quiz'}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuizzesPageInner() {
  const searchParams = useSearchParams();
  const initialTab: QuizTab = searchParams.get('tab') === 'practice' ? 'practice' : 'assigned';
  const [tab, setTab] = useState<QuizTab>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') === 'practice' ? 'practice' : 'assigned';
    setTab(t);
  }, [searchParams]);

  return (
    <div className="min-h-screen">
      <Header
        title="Quizzes"
        subtitle="Practice quizzes can be assigned by lecturers or self-generated for revision."
      />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div
          className="mb-8 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label="Quiz categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'assigned'}
            className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              tab === 'assigned'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('assigned')}
          >
            <ClipboardList className="h-4 w-4" />
            Assigned Practice Quizzes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'practice'}
            className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              tab === 'practice'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('practice')}
          >
            <Sparkles className="h-4 w-4" />
            Practice Quizzes
          </button>
        </div>

        {tab === 'assigned' ? <AssignedPracticeQuizzesPanel /> : <StudentPracticeQuizContent embedded />}
      </div>
    </div>
  );
}

export default function StudentQuizzesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <QuizzesPageInner />
    </Suspense>
  );
}
