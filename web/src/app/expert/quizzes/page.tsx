'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import QuizAssignScorePanel from '@/components/expert/quizzes/QuizAssignScorePanel';
import QuizQuestionsPanel from '@/components/expert/quizzes/QuizQuestionsPanel';
import { Loader2 } from 'lucide-react';
import { fetchExpertQuizzesPaged, type ExpertQuiz } from '@/lib/api/expert-quizzes';

export default function ExpertQuizzesPage() {
  const { data, isLoading, error } = useSWR('expert-quizzes-manage', () => fetchExpertQuizzesPaged(1, 500), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const quizzes = data?.items ?? [];
  const [selectedQuizId, setSelectedQuizId] = useState('');

  useEffect(() => {
    if (quizzes.length === 0) {
      setSelectedQuizId('');
      return;
    }
    if (!selectedQuizId || !quizzes.some((q) => q.id === selectedQuizId)) {
      setSelectedQuizId(quizzes[0].id);
    }
  }, [quizzes, selectedQuizId]);

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => q.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Quiz management"
        subtitle="Create questions, assign quizzes to classes, and review scores."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">Active quiz</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a quiz to edit its question bank. Assignments and scoring use the same catalog.
          </p>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading quizzes…
            </div>
          ) : error ? (
            <p className="mt-6 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load quizzes.'}
            </p>
          ) : quizzes.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No quizzes yet. Create quizzes via your backend or API, then refresh this page.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full max-w-xl rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
              {selectedQuiz ? <QuizMeta quiz={selectedQuiz} /> : null}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
            {selectedQuizId ? (
              <QuizQuestionsPanel quizId={selectedQuizId} />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Select a quiz to manage questions.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <QuizAssignScorePanel />
          </section>
        </div>
      </div>
    </div>
  );
}

function QuizMeta({ quiz }: { quiz: ExpertQuiz }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-xs sm:grid-cols-2">
      <div>
        <p className="text-muted-foreground">Topic</p>
        <p className="font-medium text-card-foreground">{quiz.topic ?? '—'}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Difficulty</p>
        <p className="font-medium text-card-foreground">{quiz.difficulty}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Time limit</p>
        <p className="font-medium text-card-foreground">{quiz.timeLimit} min</p>
      </div>
      <div>
        <p className="text-muted-foreground">Passing score</p>
        <p className="font-medium text-card-foreground">{quiz.passingScore}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-muted-foreground">Window</p>
        <p className="font-medium text-card-foreground">
          {new Date(quiz.openTime).toLocaleString()} → {new Date(quiz.closeTime).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
