'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
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
import { useToast } from '@/components/ui/toast';
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
import { getLecturerClasses, getClassStats } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { QuizDto, QuizQuestionDto, ClassItem, ClassStats } from '@/lib/api/types';

const QUESTIONS_PAGE_SIZE = 10;
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
  const toast = useToast();

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
  const [questionPagesLoaded, setQuestionPagesLoaded] = useState(1);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [savedDialogOpen, setSavedDialogOpen] = useState(false);

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

  useEffect(() => {
    setQuestionPagesLoaded(1);
  }, [quizId, questions.length]);

  useEffect(() => {
    const id = selectedClassId?.trim();
    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      setClassStats(null);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    getClassStats(id)
      .then((s) => {
        if (!cancelled) setClassStats(s);
      })
      .catch(() => {
        if (!cancelled) setClassStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateQuiz(quizId, {
        title,
        openTime: datetimeLocalToIso(openTimeLocal),
        closeTime: datetimeLocalToIso(closeTimeLocal),
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : null,
        passingScore: passingScore ? parseInt(passingScore, 10) : null,
      });
      setQuiz(updated);
      if (selectedClassId && selectedClassId !== originalClassId) {
        await assignQuizToClass(selectedClassId, quizId);
        const refreshed = await getQuiz(quizId);
        setQuiz(refreshed);
        setOriginalClassId(refreshed.classId || selectedClassId);
        setSelectedClassId(refreshed.classId || selectedClassId);
      } else {
        setOriginalClassId(updated.classId || originalClassId);
      }
      toast.success('Đã lưu quiz thành công.');
      setSavedDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
      toast.error(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleSavedGoBack = () => {
    setSavedDialogOpen(false);
    router.push('/lecturer/quizzes');
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

  const enrolledDisplay =
    !selectedClassId?.trim() || selectedClassId === '00000000-0000-0000-0000-000000000000'
    ? '—'
    : statsLoading
      ? '…'
      : String(classStats?.totalStudents ?? 0);
  const avgScoreDisplay =
    !selectedClassId?.trim() || selectedClassId === '00000000-0000-0000-0000-000000000000'
    ? '—'
    : statsLoading
      ? '…'
      : classStats?.avgQuizScore != null
        ? `${Math.round(classStats.avgQuizScore)}%`
        : '—';

  const visibleQuestionLimit = questionPagesLoaded * QUESTIONS_PAGE_SIZE;
  const displayedQuestions = questions.slice(0, visibleQuestionLimit);
  const canLoadMoreQuestions = displayedQuestions.length < questions.length;

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

      {/* Bento Layout — câu hỏi trái (rộng), cài đặt + stats phải */}
      <div className="grid grid-cols-12 gap-8">
        {/* Quiz Settings + stats (desktop: cột phải) */}
        <div className="order-2 col-span-12 space-y-6 lg:col-span-4">
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
                  {enrolledDisplay}
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Enrolled Students
                </p>
              </div>
            </div>
            <div className="flex h-32 flex-col justify-between rounded-3xl border border-warning/20 bg-warning/10 p-5">
              <Timer className="h-6 w-6 text-warning" />
              <div>
                <p
                  className="font-['Manrope',sans-serif] text-2xl font-extrabold text-card-foreground"
                  title="Điểm quiz trung bình của lớp (theo dữ liệu hệ thống)"
                >
                  {avgScoreDisplay}
                </p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Avg. quiz score
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Questions (desktop: cột trái) */}
        <div className="order-1 col-span-12 space-y-6 lg:order-1 lg:col-span-8">
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
              {displayedQuestions.map((q) => {
                const i = questions.findIndex((x) => x.id === q.id);
                const idx = i >= 0 ? i : 0;
                return (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    variant="curated"
                    topicCategory={TOPIC_ROTATION[idx % TOPIC_ROTATION.length]}
                    points={POINTS_ROTATION[idx % POINTS_ROTATION.length]}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                );
              })}
              {canLoadMoreQuestions ? (
                <div className="flex justify-center border-t border-border/30 pt-6">
                  <button
                    type="button"
                    onClick={() => setQuestionPagesLoaded((p) => p + 1)}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-card-foreground"
                  >
                    Load More Questions
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
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

      {/* Save success dialog */}
      {savedDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Dismiss"
            onClick={() => setSavedDialogOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-card p-8 text-center shadow-2xl">
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <h3 className="mb-2 font-['Manrope',sans-serif] text-xl font-extrabold text-card-foreground">
              Saved successfully
            </h3>
            <p className="mb-7 text-sm text-muted-foreground">
              Your quiz changes have been saved.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSavedDialogOpen(false)}
                className="w-full rounded-full border border-border bg-muted/60 px-6 py-3 text-sm font-bold text-card-foreground transition-colors hover:bg-muted"
              >
                Stay on this page
              </button>
              <button
                type="button"
                onClick={handleSavedGoBack}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Quiz Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
