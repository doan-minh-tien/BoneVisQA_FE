'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Save,
  Settings2,
  Users,
  Timer,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionEditorDialog from '@/components/lecturer/quizzes/QuestionEditorDialog';
import QuestionCard from '@/components/lecturer/quizzes/QuestionCard';
import {
  getQuiz,
  getQuizQuestions,
  deleteQuizQuestion,
  updateQuiz,
  assignQuizToClass,
} from '@/lib/api/lecturer-quiz';
import { getLecturerClasses } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { QuizDto, QuizQuestionDto, ClassItem } from '@/lib/api/types';

const CURATED_THUMBS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANP6uJMQCvFKa_-VHIY_TjUS02Vle4npm5uITt-8ufr9qLYn7tH2G-oLamGKtJdB4Q0xqrgfW8MKgPXDiemIC7hacqfvsmpr68ztx1GDCaTcQRdIdvPS5BodRcr7c_uxgcyjCuVTdRGs7Nm0CXshFYsxaavXU9G-joskNGqq1hUX_3kzyGdKkc7rp4j622BqgGc_onmn8DqSakjSFCBWqlL6SZ9P7t5uDMlSx8EdzokWTUlHI-n8WGe00EliInj0TMKxioMxX2Nhs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB-97cvDY8ai1wwOly5WC3hdnif9MZON0uLPC0tafb2ELgRPFKoSQ0PzgBbZe402wE8RjrcaUQn9dkYdZ1R7vhwuirt4Kr0owWLO8QAFHdWKlDv-v2EAJl9CIr91QlE4oP0YFvNdXIC2yKAxaQ2vdKfND6FI47N3p1M3DQbwrSunpUqy43tPFW_5HF2lZuWwtbiMeb6_JqCu-m0P4tztRgrOP34spgpFz5Dg6G1gmHGD9LUmwx6nQnBwKJH6m8VObiLIM5rMJGNmWY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC89OvUDXtwa0CGhEbQeDUrlXHwn5mqulsCyLaP7DgY6FAYY1hEoZbZvEPBRZ65P45pTkbA6UlwuoPJCI5o4SkiKUuORKobOk9mJRrYQD7cH68Sr6ktFH6Lxh9_z-B17guU_b_nr9bq9cLmM7eurURtNri8ZE6Cm6Q03ivNYFMJNRTvMf9VccnyUt_PvncTwGZzhStlw-QRVdapGpWOa6KbIzC6rO06-oatTL9Qj_A9Fb-qvutRkSi5ugkh4ig6XciQP63aq6DUIl4',
] as const;

const TOPIC_ROTATION = ['Trauma', 'Imaging', 'Joints'] as const;
const POINTS_ROTATION = [10, 15, 5] as const;

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [originalClassId, setOriginalClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionDto | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizData, questionsData, classesData] = await Promise.all([
        getQuiz(quizId),
        getQuizQuestions(quizId),
        getLecturerClasses(getStoredUserId()),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
      setClasses(classesData);
      setTitle(quizData.title);
      setSelectedClassId(quizData.classId);
      setOriginalClassId(quizData.classId);
      if (quizData.openTime) {
        setStartDate(new Date(quizData.openTime).toISOString().slice(0, 10));
      } else {
        setStartDate('');
      }
      setTimeLimit(quizData.timeLimit?.toString() || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const openIso =
        startDate.length >= 10
          ? new Date(`${startDate}T00:00:00`).toISOString()
          : undefined;
      await updateQuiz(quizId, {
        title,
        openTime: openIso,
        closeTime: quiz?.closeTime ?? undefined,
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : undefined,
      });
      if (selectedClassId && selectedClassId !== originalClassId) {
        await assignQuizToClass(selectedClassId, quizId);
      }
      alert('Quiz saved successfully!');
      router.push('/lecturer/quizzes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (question: QuizQuestionDto) => {
    setEditingQuestion(question);
    setEditorOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Remove this question?')) return;
    try {
      await deleteQuizQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditorOpen(true);
  };

  const handleQuestionSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Quiz not found'}</p>
        <Button onClick={() => router.push('/lecturer/quizzes')}>
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  const displayTitle = title || quiz.title;
  const enrolledPlaceholder = questions.length > 0 ? 124 : 0;
  const completionPlaceholder = questions.length > 0 ? 88 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar (Quiz Library mock) */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/40 bg-[#f7f9fb]/95 px-6 backdrop-blur-md dark:bg-background/95 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <div className="relative hidden w-56 sm:block lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search quiz assets..."
              className="w-full rounded-full border-0 bg-muted/80 py-2 pl-10 pr-4 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary"
            />
          </div>
          <nav className="hidden items-center gap-6 lg:flex">
            <span className="text-sm font-medium text-muted-foreground">Curriculum</span>
            <span className="text-sm font-medium text-muted-foreground">Resources</span>
            <span className="text-sm font-medium text-muted-foreground">Faculty</span>
          </nav>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            type="button"
            className="hidden rounded-full bg-muted px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted/80 sm:inline-flex"
          >
            Quick Export
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="hidden h-8 w-px bg-border/50 xl:block" />
          <div className="hidden items-center gap-3 xl:flex">
            <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-muted bg-primary/10" />
            <div>
              <p className="text-xs font-bold leading-tight text-foreground">Dr. Julian Vance</p>
              <p className="text-[10px] uppercase tracking-tight text-muted-foreground">
                Chief of Radiology
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-10 p-6 lg:p-10">
        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <nav className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/lecturer/quizzes" className="transition-colors hover:text-primary">
                Library
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="font-semibold text-foreground">{displayTitle}</span>
            </nav>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {displayTitle}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Advanced diagnostic assessment focusing on pelvic, femoral, and tibial fractures in
              emergency care scenarios.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-muted/60"
            >
              Preview Quiz
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 space-y-6 lg:col-span-4">
            <div className="space-y-6 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/30 sm:p-8">
              <div className="mb-2 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h2 className="font-headline text-lg font-bold text-foreground">Quiz Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border-0 bg-muted/70 px-4 py-3 text-sm font-medium outline-none ring-0 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Class Assignment
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-xl border-0 bg-muted/70 px-4 py-3 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select class…</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.className}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border-0 bg-muted/70 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Duration
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl border-0 bg-muted/70 px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary"
                        placeholder="45"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                        MIN
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Advanced radiological review of complex trauma…"
                    className="w-full resize-none rounded-xl border-0 bg-muted/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex h-32 flex-col justify-between rounded-3xl bg-teal-100/90 p-5 dark:bg-teal-950/40">
                <Users className="h-6 w-6 text-teal-900 dark:text-teal-200" />
                <div>
                  <p className="font-headline text-2xl font-extrabold text-teal-950 dark:text-teal-50">
                    {enrolledPlaceholder}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-teal-900/70 dark:text-teal-200/70">
                    Enrolled Students
                  </p>
                </div>
              </div>
              <div className="flex h-32 flex-col justify-between rounded-3xl bg-orange-100/90 p-5 dark:bg-orange-950/30">
                <Timer className="h-6 w-6 text-orange-950 dark:text-orange-200" />
                <div>
                  <p className="font-headline text-2xl font-extrabold text-orange-950 dark:text-orange-50">
                    {completionPlaceholder ? `${completionPlaceholder}%` : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-orange-950/70 dark:text-orange-200/70">
                    Avg. Completion
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-8">
            <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-headline text-xl font-bold text-foreground">Curated Questions</h2>
                <p className="text-sm text-muted-foreground">
                  {questions.length} diagnostic item{questions.length === 1 ? '' : 's'} currently in
                  this quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <PlusCircle className="h-5 w-5" />
                Add New Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/20 p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <PlusCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">No questions yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Add questions to build this quiz.
                </p>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4" /> Add First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    variant="curated"
                    topicCategory={TOPIC_ROTATION[i % TOPIC_ROTATION.length]}
                    caseThumbnail={CURATED_THUMBS[i % CURATED_THUMBS.length]}
                    points={POINTS_ROTATION[i % POINTS_ROTATION.length]}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
                <div className="flex justify-center border-t border-border/30 pt-6">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Load More Questions
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] text-white shadow-2xl md:hidden disabled:opacity-50"
        aria-label="Save"
      >
        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
      </button>

      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
        }}
        quizId={quizId}
        question={editingQuestion}
        onSuccess={handleQuestionSuccess}
      />
    </div>
  );
}
