'use client';

import { useMemo, useState } from 'react';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchStudentPracticeQuiz, submitStudentQuiz } from '@/lib/api/student';
import type { StudentPracticeQuiz, StudentQuizSubmissionResult } from '@/lib/api/types';
import {
  CheckCircle,
  Loader2,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react';

const topicSuggestions = [
  'Long Bone Fractures',
  'Spine Lesions',
  'Joint Diseases',
  'Bone Tumors',
  'Upper Extremity',
  'Lower Extremity',
];

export default function StudentQuizPage() {
  const toast = useToast();
  const [topic, setTopic] = useState(topicSuggestions[0]);
  const [quiz, setQuiz] = useState<StudentPracticeQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<StudentQuizSubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const completion = useMemo(() => {
    if (!quiz) return 0;
    const answered = quiz.questions.filter((question) => answers[question.questionId]).length;
    return Math.round((answered / quiz.questions.length) * 100);
  }, [answers, quiz]);

  const handleLoadQuiz = async () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const data = await fetchStudentPracticeQuiz(topic);
      setQuiz(data);
      toast.success(`Practice quiz loaded for ${data.topic}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load practice quiz.');
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const payload = quiz.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answers[question.questionId] || '',
    }));
    setSubmitting(true);
    try {
      const submission = await submitStudentQuiz(quiz.attemptId, payload);
      setResult(submission);
      toast.success('Quiz submitted successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <StudentAppChrome
        title="Practice Quiz"
        subtitle="Load a topic-focused quiz from the backend and submit one live attempt"
      />

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-card-foreground">
                Topic
              </label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {topicSuggestions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" onClick={() => void handleLoadQuiz()} isLoading={loading} disabled={loading}>
              {!loading && <Play className="h-4 w-4" />}
              Load Practice Quiz
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This page no longer fakes a quiz catalog. It requests a live practice quiz for the selected topic.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Fetching practice quiz...
            </div>
          </div>
        ) : !quiz ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-card-foreground">No practice quiz loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a topic and request a quiz from `GET /api/student/quizzes/practice`.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatTile label="Quiz title" value={quiz.title} />
              <StatTile label="Topic" value={quiz.topic} />
              <StatTile label="Questions" value={quiz.questions.length.toString()} />
              <StatTile label="Completion" value={`${completion}%`} />
            </div>

            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const options = [
                  { key: 'A', value: question.optionA },
                  { key: 'B', value: question.optionB },
                  { key: 'C', value: question.optionC },
                  { key: 'D', value: question.optionD },
                ];

                return (
                  <section key={question.questionId} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Question {index + 1}
                        </p>
                        <h2 className="mt-2 text-base font-semibold text-card-foreground">
                          {question.questionText}
                        </h2>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
                        {question.type}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {options.map((option) => {
                        const isSelected = answers[question.questionId] === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.questionId]: option.key,
                              }))
                            }
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/8 text-card-foreground'
                                : 'border-border bg-background/70 text-muted-foreground hover:bg-background'
                            }`}
                          >
                            <span className="mr-2 font-semibold text-primary">{option.key}.</span>
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void handleSubmit()} isLoading={submitting} disabled={submitting}>
                {!submitting && <CheckCircle className="h-4 w-4" />}
                Submit Quiz
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuiz(null);
                  setAnswers({});
                  setResult(null);
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Session
              </Button>
            </div>

            {result ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-card-foreground">Submission result</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <StatTile label="Score" value={`${result.score}%`} />
                  <StatTile label="Passing score" value={`${result.passingScore}%`} />
                  <StatTile label="Correct answers" value={`${result.correctAnswers}/${result.totalQuestions}`} />
                  <StatTile
                    label="Outcome"
                    value={result.passed ? 'Passed' : 'Needs improvement'}
                    tone={result.passed ? 'success' : 'warning'}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-card-foreground';

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
