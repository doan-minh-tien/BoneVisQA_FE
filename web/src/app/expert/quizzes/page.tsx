'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import QuizAssignScorePanel from '@/components/expert/quizzes/QuizAssignScorePanel';
import QuizQuestionsPanel from '@/components/expert/quizzes/QuizQuestionsPanel';
import { Loader2, Plus, X } from 'lucide-react';
import { fetchExpertQuizzesPaged, createExpertQuiz, type ExpertQuiz, type CreateExpertQuizRequest } from '@/lib/api/expert-quizzes';
import { useToast } from '@/components/ui/toast';

export default function ExpertQuizzesPage() {
  const { data, isLoading, error, mutate } = useSWR('expert-quizzes-manage', () => fetchExpertQuizzesPaged(1, 500), {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const quizzes = data?.items ?? [];
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const handleQuizCreated = (newQuiz: ExpertQuiz) => {
    mutate();
    setSelectedQuizId(newQuiz.id);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Quiz management"
        subtitle="Create questions, assign quizzes to classes, and review scores."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">Active quiz</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a quiz to edit its question bank. Assignments and scoring use the same catalog.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Quiz
            </button>
          </div>

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
              No quizzes yet. Click "Create Quiz" to create your first quiz.
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

      {isCreateModalOpen && (
        <CreateQuizModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleQuizCreated}
        />
      )}
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

interface CreateQuizModalProps {
  onClose: () => void;
  onCreated: (quiz: ExpertQuiz) => void;
}

function CreateQuizModal({ onClose, onCreated }: CreateQuizModalProps) {
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
  const [form, setForm] = useState({
    title: '',
    topic: '',
    topicMode: 'select' as 'select' | 'custom',
    difficulty: 'Medium',
    timeLimit: 30,
    passingScore: 7,
    openDate: '',
    openTime: '09:00',
    closeDate: '',
    closeTime: '18:00',
    classification: '',
  });

  const canSubmit = form.title.trim().length > 0 && form.openDate && form.closeDate;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const openTime = new Date(`${form.openDate}T${form.openTime}`).toISOString();
      const closeTime = new Date(`${form.closeDate}T${form.closeTime}`).toISOString();

      const request: CreateExpertQuizRequest = {
        title: form.title.trim(),
        topic: form.topic.trim() || null,
        difficulty: form.difficulty,
        timeLimit: form.timeLimit,
        passingScore: form.passingScore,
        openTime,
        closeTime,
        classification: form.classification.trim() || null,
        isAiGenerated: false,
      };

      const newQuiz = await createExpertQuiz(request);
      toast.success('Quiz created successfully!');
      onCreated(newQuiz);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create quiz.';
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
          <h3 className="text-lg font-semibold text-card-foreground">Create New Quiz</h3>
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
                {form.topicMode === 'select' ? 'Nhập tùy chỉnh' : 'Chọn từ danh sách'}
              </button>
            </div>
            {form.topicMode === 'select' ? (
              <select
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">-- Chọn Topic --</option>
                {PREDEFINED_TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="Nhập topic mới..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
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
              <label className="block text-sm font-medium text-card-foreground mb-1">Time Limit (min)</label>
              <input
                type="number"
                value={form.timeLimit}
                onChange={(e) => setForm((p) => ({ ...p, timeLimit: parseInt(e.target.value) || 0 }))}
                min={1}
                max={300}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Passing Score</label>
              <input
                type="number"
                value={form.passingScore}
                onChange={(e) => setForm((p) => ({ ...p, passingScore: parseInt(e.target.value) || 0 }))}
                min={0}
                max={10}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Open Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={form.openDate}
                onChange={(e) => setForm((p) => ({ ...p, openDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Open Time</label>
              <input
                type="time"
                value={form.openTime}
                onChange={(e) => setForm((p) => ({ ...p, openTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Close Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={form.closeDate}
                onChange={(e) => setForm((p) => ({ ...p, closeDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Close Time</label>
              <input
                type="time"
                value={form.closeTime}
                onChange={(e) => setForm((p) => ({ ...p, closeTime: e.target.value }))}
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
