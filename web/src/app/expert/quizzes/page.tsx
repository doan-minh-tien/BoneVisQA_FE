'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Header from '@/components/Header';
import QuizAssignScorePanel from '@/components/expert/quizzes/QuizAssignScorePanel';
import QuizQuestionsPanel from '@/components/expert/quizzes/QuizQuestionsPanel';
import { 
  Loader2, Plus, Pencil, Trash2, 
} from 'lucide-react';
import { fetchExpertQuizzesPaged, deleteExpertQuiz, fetchQuizAssignmentStatus, type ExpertQuiz } from '@/lib/api/expert-quizzes';
import { useToast } from '@/components/ui/toast';

export default function ExpertQuizzesPage() {
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR('expert-quizzes-manage', () => fetchExpertQuizzesPaged(1, 500), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const toast = useToast();

  const quizzes = data?.items ?? [];
  const [selectedQuizId, setSelectedQuizId] = useState('');
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

  const handleQuizCreated = () => {
    mutate();
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
      router.push(`/expert/quizzes/create?edit=${quiz.id}`);
    } catch (e) {
      toast.error('Failed to check assignment status.');
      setAssignmentStatus(null);
      setEditQuiz(quiz);
      router.push(`/expert/quizzes/create?edit=${quiz.id}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCreateQuiz = () => {
    router.push('/expert/quizzes/create');
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
              onClick={handleCreateQuiz}
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

function LibrarySection() {
  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground">
      <p className="text-sm text-muted-foreground">Quiz Library feature coming soon...</p>
    </section>
  );
}