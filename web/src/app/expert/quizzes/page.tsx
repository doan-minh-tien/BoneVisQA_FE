'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import QuizAssignScorePanel from '@/components/expert/quizzes/QuizAssignScorePanel';
import QuizQuestionsPanel from '@/components/expert/quizzes/QuizQuestionsPanel';
import { Loader2, Plus, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { fetchExpertQuizzesPaged, createExpertQuiz, updateExpertQuiz, deleteExpertQuiz, fetchQuizAssignmentStatus, type ExpertQuiz, type CreateExpertQuizRequest, type UpdateExpertQuizRequest } from '@/lib/api/expert-quizzes';
import { useToast } from '@/components/ui/toast';

// ========== HELPERS ==========

function utcToLocalDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  // Convert UTC to local timezone (UTC+7 for Vietnam)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeLocalToIso(local: string): string {
  const t = local.trim();
  if (!t) return '';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

export default function ExpertQuizzesPage() {
  const { data, isLoading, error, mutate } = useSWR('expert-quizzes-manage', () => fetchExpertQuizzesPaged(1, 500), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const toast = useToast();

  const quizzes = data?.items ?? [];
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<ExpertQuiz | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState<{ isAssigned: boolean; assignedClassCount: number } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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

  const handleQuizCreated = (quiz: ExpertQuiz) => {
    mutate();
    setSelectedQuizId(quiz.id);
    setIsCreateModalOpen(false);
    setEditQuiz(null);
    setAssignmentStatus(null);
  };

  const handleDeleteQuiz = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteExpertQuiz(deleteConfirmId);
      toast.success('Quiz deleted successfully!');
      mutate();
      if (selectedQuizId === deleteConfirmId) {
        setSelectedQuizId('');
      }
      setDeleteConfirmId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete quiz.');
    }
  };

  const handleEditQuiz = async (quiz: ExpertQuiz) => {
    setIsCheckingStatus(true);
    try {
      const status = await fetchQuizAssignmentStatus(quiz.id);
      setAssignmentStatus({ isAssigned: status.isAssigned, assignedClassCount: status.assignedClassCount });
      setEditQuiz(quiz);
      setIsCreateModalOpen(true);
    } catch (e) {
      toast.error('Failed to check assignment status.');
      setAssignmentStatus(null);
      setEditQuiz(quiz);
      setIsCreateModalOpen(true);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Quiz management"
        subtitle="Create questions, assign quizzes to classes, and review scores."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              !showLibrary
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
            onClick={() => setShowLibrary(false)}
          >
            My Quizzes
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              showLibrary
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
            onClick={() => setShowLibrary(true)}
          >
            Quiz Library
          </button>
        </div>

        {!showLibrary ? (
          <>
            {/* My Quizzes Section */}
            <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">Active quiz</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a quiz to edit its question bank. Assignments and scoring use the same catalog.
              </p>
            </div>
            <button
              onClick={() => {
                setEditQuiz(null);
                setAssignmentStatus(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Quiz
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading quizzes...
            </div>
          ) : error ? (
            <p className="mt-6 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load quizzes.'}
            </p>
          ) : quizzes.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No quizzes yet. Click "Create Quiz" to create your first quiz.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="flex-1 max-w-xl rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
                {selectedQuiz && (
                  <>
                    <button
                      onClick={() => handleEditQuiz(selectedQuiz)}
                      disabled={isCheckingStatus}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(selectedQuizId)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/50 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
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
          </>
        ) : (
          <>
            {/* Quiz Library Section - Xem quiz tu Expert khac */}
            <LibrarySection />
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateQuizModal
          onClose={() => { setIsCreateModalOpen(false); setEditQuiz(null); setAssignmentStatus(null); }}
          onCreated={handleQuizCreated}
          editQuiz={editQuiz}
          assignmentStatus={assignmentStatus}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuiz}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-destructive hover:bg-destructive/90 cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizMeta({ quiz }: { quiz: ExpertQuiz }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-xs sm:grid-cols-2">
      <div>
        <p className="text-muted-foreground">Topic</p>
        <p className="font-medium text-card-foreground">{quiz.topic ?? '-'}</p>
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
        <p className="font-medium text-card-foreground">{quiz.passingScore}%</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-muted-foreground">Window</p>
        <p className="font-medium text-card-foreground">
          {new Date(quiz.openTime).toLocaleString()} - {new Date(quiz.closeTime).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

interface CreateQuizModalProps {
  onClose: () => void;
  onCreated: (quiz: ExpertQuiz) => void;
  editQuiz?: ExpertQuiz | null;
  assignmentStatus?: { isAssigned: boolean; assignedClassCount: number } | null;
}

function CreateQuizModal({ onClose, onCreated, editQuiz, assignmentStatus }: CreateQuizModalProps) {
  const isEditMode = !!editQuiz;
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PREDEFINED_TOPICS = [
    'Lower Limb',
    'Upper Limb',
    'Spine',
    'Chest',
    'Abdomen',
    'Head & Neck',
    'Pelvis',
    'General',
  ];

  const getInitialForm = () => {
    if (editQuiz) {
      return {
        title: editQuiz.title,
        topic: editQuiz.topic || '',
        topicMode: PREDEFINED_TOPICS.includes(editQuiz.topic || '') ? 'select' as const : 'custom' as const,
        difficulty: editQuiz.difficulty,
        timeLimit: editQuiz.timeLimit,
        passingScore: editQuiz.passingScore,
        openDateTime: utcToLocalDatetimeLocal(editQuiz.openTime),
        closeDateTime: utcToLocalDatetimeLocal(editQuiz.closeTime),
        classification: editQuiz.classification || '',
      };
    }
    return {
      title: '',
      topic: '',
      topicMode: 'select' as 'select' | 'custom',
      difficulty: 'Medium',
      timeLimit: 30,
      passingScore: 70,
      openDateTime: '',
      closeDateTime: '',
      classification: '',
    };
  };

  const [form, setForm] = useState(getInitialForm);

  const canSubmit = form.title.trim().length > 0 && form.openDateTime && form.closeDateTime;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const openTime = localDatetimeLocalToIso(form.openDateTime);
      const closeTime = localDatetimeLocalToIso(form.closeDateTime);

      if (isEditMode && editQuiz) {
        // Update existing quiz - Expert can update Title, Topic, Open/Close, Difficulty, TimeLimit, PassingScore
        const request: UpdateExpertQuizRequest = {
          title: form.title.trim(),
          topic: form.topic.trim() || null,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit ?? null,
          passingScore: form.passingScore ?? null,
          openTime,
          closeTime,
          classification: form.classification.trim() || null,
        };

        const updatedQuiz = await updateExpertQuiz(editQuiz.id, request);
        toast.success('Quiz updated successfully!');
        onCreated(updatedQuiz);
      } else {
        const request: CreateExpertQuizRequest = {
          title: form.title.trim(),
          topic: form.topic.trim() || null,
          difficulty: form.difficulty,
          timeLimit: form.timeLimit ?? 30, // Default 30 if not set
          passingScore: form.passingScore ?? 70, // Default 70 if not set
          openTime,
          closeTime,
          classification: form.classification.trim() || null,
          isAiGenerated: false,
        };

        const newQuiz = await createExpertQuiz(request);
        toast.success('Quiz created successfully!');
        onCreated(newQuiz);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save quiz.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            {isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded cursor-pointer">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Quiz Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Lower Limb Quiz 1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-card-foreground">Topic</label>
              <button
                type="button"
                onClick={() => setForm((p) => ({ 
                  ...p, 
                  topicMode: p.topicMode === 'select' ? 'custom' : 'select',
                  topic: '',
                }))}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {form.topicMode === 'select' ? 'Tu nhap topic' : 'Chon tu danh sach'}
              </button>
            </div>
            {form.topicMode === 'select' ? (
              <select
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">-- Chon Topic --</option>
                {PREDEFINED_TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="Nhập topic moi..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* ===== WARNING: Quiz da duoc gan vao lop ===== */}
          {isEditMode && assignmentStatus?.isAssigned && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Warning: Quiz da duoc gan vao lop hoc
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Quiz nay da duoc gan vao <strong>{assignmentStatus.assignedClassCount} lop</strong>.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Cac lop da gan se <strong>KHONG</strong> bi anh huong boi thay doi nay.
                    Chi cac lop moi gan sau nay moi dung gia tri moi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== TIME LIMIT & PASSING SCORE - FOR EXPERT TO SET ===== */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Quiz Configuration (for your reference - these will be used as defaults when lecturers assign this quiz)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={form.timeLimit}
                  onChange={(e) => setForm((p) => ({ ...p, timeLimit: Number(e.target.value) }))}
                  min={5}
                  max={180}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default time limit for this quiz (5-180 min)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Passing Score (0-100)
                </label>
                <input
                  type="number"
                  value={form.passingScore}
                  onChange={(e) => setForm((p) => ({ ...p, passingScore: Number(e.target.value) }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default passing score (lecturers can adjust ±10%)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Classification</label>
              <input
                type="text"
                value={form.classification}
                onChange={(e) => setForm((p) => ({ ...p, classification: e.target.value }))}
                placeholder="e.g., Year 1"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Open Time <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.openDateTime}
                onChange={(e) => setForm((p) => ({ ...p, openDateTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Close Time <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.closeDateTime}
                onChange={(e) => setForm((p) => ({ ...p, closeDateTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting || !canSubmit}
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : isEditMode ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibrarySection() {
  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground">
      <p className="text-sm text-muted-foreground">Quiz Library feature coming soon...</p>
    </section>
  );
}