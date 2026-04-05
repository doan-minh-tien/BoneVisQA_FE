'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Plus,
  ChevronRight,
  ChevronDown,
  Save,
  Settings2,
  Users,
  Timer,
  PlusCircle,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionEditorDialog from '@/components/lecturer/quizzes/QuestionEditorDialog';
import QuestionImportDialog from '@/components/lecturer/quizzes/QuestionImportDialog';
import type { ParsedQuestion } from '@/components/lecturer/quizzes/QuestionImportDialog';
import QuestionCard from '@/components/lecturer/quizzes/QuestionCard';
import {
  getQuiz,
  getQuizQuestions,
  deleteQuizQuestion,
  addQuizQuestion,
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

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

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
  const [openTimeLocal, setOpenTimeLocal] = useState('');
  const [closeTimeLocal, setCloseTimeLocal] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passingScore, setPassingScore] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
      setOpenTimeLocal(isoToDatetimeLocal(quizData.openTime));
      setCloseTimeLocal(isoToDatetimeLocal(quizData.closeTime));
      setTimeLimit(quizData.timeLimit?.toString() || '');
      setPassingScore(quizData.passingScore != null ? String(quizData.passingScore) : '');
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
      await updateQuiz(quizId, {
        title,
        openTime: datetimeLocalToIso(openTimeLocal),
        closeTime: datetimeLocalToIso(closeTimeLocal),
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : null,
        passingScore: passingScore ? parseInt(passingScore, 10) : null,
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

  const handleImportQuestions = async (parsed: ParsedQuestion[]) => {
    for (const p of parsed) {
      try {
        await addQuizQuestion({
          quizId,
          questionText: p.questionText,
          type: p.type,
          optionA: p.optionA,
          optionB: p.optionB,
          optionC: p.optionC,
          optionD: p.optionD,
          correctAnswer: p.correctAnswer,
        });
      } catch {
        // skip failures silently
      }
    }
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <nav className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/lecturer/quizzes" className="transition-colors hover:text-primary">
              Library
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-semibold text-foreground">{displayTitle}</span>
          </nav>
          <h1 className="font-['Manrope',sans-serif] text-[2.75rem] font-extrabold tracking-tight text-card-foreground">
            {displayTitle}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Advanced diagnostic assessment focusing on pelvic, femoral, and tibial fractures in emergency care scenarios.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-bold text-card-foreground transition-all hover:bg-muted/60"
          >
            Preview Quiz
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </section>

      {/* Bento Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Quiz Settings */}
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border/30">
            <div className="mb-2 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <h2 className="font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">Quiz Settings</h2>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={openTimeLocal}
                    onChange={(e) => setOpenTimeLocal(e.target.value)}
                    className="w-full rounded-xl border-0 bg-muted/70 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={closeTimeLocal}
                    onChange={(e) => setCloseTimeLocal(e.target.value)}
                    className="w-full rounded-xl border-0 bg-muted/70 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Time limit
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border-0 bg-muted/70 px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                      MIN
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Passing (%)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="w-full rounded-xl border-0 bg-muted/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="80"
                  />
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex h-32 flex-col justify-between rounded-3xl border border-secondary/20 bg-secondary/10 p-5">
              <Users className="h-6 w-6 text-secondary" />
              <div>
                <p className="font-['Manrope',sans-serif] text-2xl font-extrabold text-card-foreground">
                  {enrolledPlaceholder}
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Enrolled Students
                </p>
              </div>
            </div>
            <div className="flex h-32 flex-col justify-between rounded-3xl border border-warning/20 bg-warning/10 p-5">
              <Timer className="h-6 w-6 text-warning" />
              <div>
                <p className="font-['Manrope',sans-serif] text-2xl font-extrabold text-card-foreground">
                  {completionPlaceholder ? `${completionPlaceholder}%` : '—'}
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Avg. Completion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-['Manrope',sans-serif] text-xl font-bold text-card-foreground">
                Curated Questions
              </h2>
              <p className="text-sm text-muted-foreground">
                {questions.length} diagnostic item{questions.length === 1 ? '' : 's'} currently in this quiz.
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
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-card-foreground"
            >
              <UploadCloud className="h-4 w-4" />
              Import
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/20 p-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-['Manrope',sans-serif] text-lg font-semibold text-card-foreground">
                No questions yet
              </h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Add questions to build this quiz.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4" /> Add First Question
                </Button>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <UploadCloud className="h-4 w-4" /> Import from File
                </Button>
              </div>
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
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  Load More Questions
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB - mobile only */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl md:hidden disabled:opacity-50"
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

      <QuestionImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportQuestions}
      />
    </div>
  );
}
