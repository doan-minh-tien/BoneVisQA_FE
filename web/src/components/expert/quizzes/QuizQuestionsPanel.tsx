'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  createExpertQuizQuestion,
  deleteExpertQuizQuestion,
  fetchExpertQuizQuestions,
  updateExpertQuizQuestion,
} from '@/lib/api/expert-quiz-questions';
import { fetchExpertCasesPaged } from '@/lib/api/expert-cases';
import type { ExpertCase } from '@/lib/api/expert-cases';
import type { ExpertQuizQuestion } from '@/lib/api/expert-quiz-questions';

// Note: component này được dùng ngay trong trang expert quiz (expand theo quiz),
// nên xử lý UI modal nội bộ để thao tác question dễ hơn.

type QuestionModalMode = 'create' | 'edit';

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const Q_PAGE_SIZE = 5;

export default function QuizQuestionsPanel({ quizId }: { quizId: string }) {
  const toast = useToast();

  const [questions, setQuestions] = useState<ExpertQuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state for questions
  const [qPage, setQPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<QuestionModalMode>('create');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ q: ExpertQuizQuestion } | null>(null);

  const [cases, setCases] = useState<ExpertCase[]>([]);
  const [isCasesLoading, setIsCasesLoading] = useState(false);

  const [form, setForm] = useState<{
    caseId: string;
    questionText: string;
    type: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
  }>({
    caseId: '',
    questionText: '',
    type: 'selection-choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
  });

  const loadCases = async () => {
    setIsCasesLoading(true);
    try {
      // Dùng API expert-cases để lấy danh sách cases (có id và case title)
      const res = await fetchExpertCasesPaged(1, 100);
      setCases(res.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load cases.';
      toast.error(msg);
    } finally {
      setIsCasesLoading(false);
    }
  };

  const loadQuestions = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const list = await fetchExpertQuizQuestions(quizId);
      setQuestions(list);
      setQPage(1); // reset về trang 1 khi load lại
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load questions.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const openCreate = async () => {
    setMode('create');
    setEditingQuestionId(null);
    if (cases.length === 0) await loadCases();
    setForm({
      caseId: cases[0]?.id ?? '',
      questionText: '',
      type: 'selection-choice',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = async (q: ExpertQuizQuestion) => {
    setMode('edit');
    setEditingQuestionId(q.questionId);

    // Đảm bảo load cases xong, dùng giá trị trả về thay vì đọc state (tránh race condition)
    let resolvedCases = cases;
    if (!cases.length) {
      setIsCasesLoading(true);
      try {
        const res = await fetchExpertCasesPaged(1, 100);
        resolvedCases = res.items;
        setCases(res.items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load cases.';
        toast.error(msg);
      } finally {
        setIsCasesLoading(false);
      }
    }

    const inferredCaseId =
      (q.caseTitle ? resolvedCases.find((c) => c.title === q.caseTitle)?.id : undefined) ?? '';

    setForm({
      caseId: inferredCaseId || resolvedCases[0]?.id || '',
      questionText: q.questionText ?? '',
      type: q.type ?? 'selection-choice',
      optionA: q.optionA ?? '',
      optionB: q.optionB ?? '',
      optionC: q.optionC ?? '',
      optionD: q.optionD ?? '',
      correctAnswer: q.correctAnswer ?? '',
    });
    setIsModalOpen(true);
  };

  const canSubmit = useMemo(() => {
    if (mode === 'edit') {
      // Khi edit: caseId có thể giữ nguyên, chỉ cần questionText và correctAnswer
      return Boolean(form.questionText.trim() && form.type.trim() && form.correctAnswer.trim());
    }
    // Khi create: bắt buộc chọn case
    return Boolean(form.caseId && form.questionText.trim() && form.type.trim() && form.correctAnswer.trim());
  }, [mode, form.caseId, form.questionText, form.type, form.correctAnswer]);

  // Computed pagination values
  const qTotalPages = Math.max(1, Math.ceil(questions.length / Q_PAGE_SIZE));
  const pagedQuestions = useMemo(() => {
    const start = (qPage - 1) * Q_PAGE_SIZE;
    return questions.slice(start, start + Q_PAGE_SIZE);
  }, [questions, qPage]);

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error('Please fill required fields.');
      return;
    }
    setIsSaving(true);
    try {
      if (mode === 'create') {
        await createExpertQuizQuestion(quizId, {
          caseId: form.caseId,
          questionText: form.questionText.trim(),
          type: form.type.trim(),
          optionA: form.optionA.trim() || undefined,
          optionB: form.optionB.trim() || undefined,
          optionC: form.optionC.trim() || undefined,
          optionD: form.optionD.trim() || undefined,
          correctAnswer: form.correctAnswer.trim(),
        });
        toast.success('Question created successfully.');
      } else {
        if (!editingQuestionId) throw new Error('Missing question id.');
        await updateExpertQuizQuestion(editingQuestionId, {
          quizId,
          caseId: form.caseId,
          questionText: form.questionText.trim(),
          type: form.type.trim(),
          optionA: form.optionA.trim() || undefined,
          optionB: form.optionB.trim() || undefined,
          optionC: form.optionC.trim() || undefined,
          optionD: form.optionD.trim() || undefined,
          correctAnswer: form.correctAnswer.trim(),
        });
        toast.success('Question updated successfully.');
      }
      setIsModalOpen(false);
      await loadQuestions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    const q = questions.find((qq) => qq.questionId === questionId) ?? null;
    if (!q) return;
    setDeleteDialog({ q });
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setIsSaving(true);
    try {
      await deleteExpertQuizQuestion(deleteDialog.q.questionId);
      toast.success('Question deleted successfully.');
      await loadQuestions();
      setDeleteDialog(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading questions...</div>
    );
  }

  return (
    <>
      {isModalOpen && (
        <ModalShell
          title={mode === 'edit' ? 'Edit Quiz Question' : 'Create Quiz Question'}
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Case</label>
              <select
                value={form.caseId}
                onChange={(e) => setForm((p) => ({ ...p, caseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                {isCasesLoading ? <option value="">Loading...</option> : null}
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.categoryName ? `(${c.categoryName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Question Text</label>
              <input
                value={form.questionText}
                onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="selection-choice">selection-choice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Correct Answer</label>
              <input
                value={form.correctAnswer}
                onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                placeholder="e.g., b"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Options – always shown */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Option A</label>
              <input
                value={form.optionA}
                onChange={(e) => setForm((p) => ({ ...p, optionA: e.target.value }))}
                placeholder="Option A..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Option B</label>
              <input
                value={form.optionB}
                onChange={(e) => setForm((p) => ({ ...p, optionB: e.target.value }))}
                placeholder="Option B..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Option C</label>
              <input
                value={form.optionC}
                onChange={(e) => setForm((p) => ({ ...p, optionC: e.target.value }))}
                placeholder="Option C..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Option D</label>
              <input
                value={form.optionD}
                onChange={(e) => setForm((p) => ({ ...p, optionD: e.target.value }))}
                placeholder="Option D..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={isSaving || !canSubmit}
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </ModalShell>
      )}

      {deleteDialog && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteDialog(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Delete Question</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Delete <strong className="text-card-foreground">{deleteDialog.q.questionText}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-destructive hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-card-foreground">
          Questions
          {questions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({questions.length} total)
            </span>
          )}
        </div>
        <button
          disabled={isSaving}
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 cursor-pointer transition-colors"
        >
          + Add Question
        </button>
      </div>

      {error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : questions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No questions yet.</div>
      ) : (
        <>
          <div className="space-y-2">
            {pagedQuestions.map((q, idx) => {
              const globalIdx = (qPage - 1) * Q_PAGE_SIZE + idx + 1;
              return (
                <div key={q.questionId} className="p-3 rounded-lg border border-border bg-input/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary font-bold text-[10px] mr-1.5">{globalIdx}</span>
                        Case: <span className="text-card-foreground font-medium">{q.caseTitle ?? '-'}</span>
                      </div>
                      <div className="text-sm font-medium text-card-foreground mt-1">{q.questionText}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Type: <span className="text-card-foreground font-medium">{q.type}</span>
                      </div>
                      {q.optionA || q.optionB || q.optionC || q.optionD ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {q.optionA ? <div>A: {q.optionA}</div> : null}
                          {q.optionB ? <div>B: {q.optionB}</div> : null}
                          {q.optionC ? <div>C: {q.optionC}</div> : null}
                          {q.optionD ? <div>D: {q.optionD}</div> : null}
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground mt-2">
                        Correct: <span className="text-card-foreground font-medium">{q.correctAnswer}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={isSaving}
                        onClick={() => openEdit(q)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={() => handleDelete(q.questionId)}
                        className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question Pagination */}
          {qTotalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <button
                disabled={qPage <= 1}
                onClick={() => setQPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-input disabled:opacity-40 cursor-pointer transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page <span className="text-card-foreground font-semibold">{qPage}</span> / {qTotalPages}
              </span>
              <button
                disabled={qPage >= qTotalPages}
                onClick={() => setQPage((p) => Math.min(qTotalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-input disabled:opacity-40 cursor-pointer transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}

