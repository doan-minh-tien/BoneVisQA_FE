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
import { ImagePlus, X, Loader2, UploadCloud } from 'lucide-react';
import { uploadExpertWorkbenchImage } from '@/lib/supabase/upload-medical-case-image';
import ExpertQuestionImportDialog, { type ExpertParsedQuestion } from './ExpertQuestionImportDialog';

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
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="shrink-0 border-b border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
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
  const [isUploading, setIsUploading] = useState(false);

  // Import dialog state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [form, setForm] = useState<{
    caseId: string;
    questionText: string;
    type: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    imageUrl: string;
    imagePreview: string | null;
  }>({
    caseId: '',
    questionText: '',
    type: 'selection-choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    imageUrl: '',
    imagePreview: null,
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
      imageUrl: '',
      imagePreview: null,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadExpertWorkbenchImage(file);
      setForm((p) => ({ ...p, imageUrl: url, imagePreview: url }));
      toast.success('Image uploaded successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed.';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setForm((p) => ({ ...p, imageUrl: '', imagePreview: null }));
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
      imageUrl: q.imageUrl ?? '',
      imagePreview: q.imageUrl ?? null,
    });
    setIsModalOpen(true);
  };

  const canSubmit = useMemo(() => {
    if (mode === 'edit') {
      // Khi edit: chỉ cần questionText, correctAnswer. CaseId và ImageUrl có thể giữ nguyên
      return Boolean(form.questionText.trim() && form.type.trim() && form.correctAnswer.trim());
    }
    // Khi create: bắt buộc questionText, correctAnswer. CaseId có thể empty (sẽ fallback). ImageUrl KHÔNG bắt buộc
    return Boolean(form.questionText.trim() && form.type.trim() && form.correctAnswer.trim());
  }, [mode, form.questionText, form.type, form.correctAnswer]);

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
        // Nếu không chọn case, dùng case đầu tiên
        const resolvedCaseId = form.caseId || cases[0]?.id;
        await createExpertQuizQuestion(quizId, {
          caseId: resolvedCaseId,
          questionText: form.questionText.trim(),
          type: form.type.trim(),
          optionA: form.optionA.trim() || undefined,
          optionB: form.optionB.trim() || undefined,
          optionC: form.optionC.trim() || undefined,
          optionD: form.optionD.trim() || undefined,
          correctAnswer: form.correctAnswer.trim(),
          imageUrl: form.imageUrl || undefined,
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
          imageUrl: form.imageUrl || undefined,
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

  // Handle bulk import questions
  const handleBulkImport = async (importedQuestions: ExpertParsedQuestion[]) => {
    if (!cases.length) await loadCases();

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const q of importedQuestions) {
      try {
        // Find case by title if provided
        let caseId: string | undefined = undefined;
        if (q.caseTitle) {
          const matchedCase = cases.find((c) => c.title === q.caseTitle);
          caseId = matchedCase?.id;
        }
        // Fallback to first case if no case matched
        if (!caseId && cases.length > 0) {
          caseId = cases[0].id;
        }

        // Skip if missing required fields
        if (!q.questionText || !q.correctAnswer) continue;

        await createExpertQuizQuestion(quizId, {
          caseId,  // undefined if not found
          questionText: q.questionText,
          type: q.type || 'selection-choice',
          optionA: q.optionA?.trim() || undefined,
          optionB: q.optionB?.trim() || undefined,
          optionC: q.optionC?.trim() || undefined,
          optionD: q.optionD?.trim() || undefined,
          correctAnswer: q.correctAnswer,
          imageUrl: undefined, // Bulk import skips image requirement
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsImporting(false);
    if (successCount > 0) {
      toast.success(`Imported ${successCount} question(s) successfully.`);
      if (failCount > 0) {
        toast.info(`Failed to import ${failCount} question(s). Check the errors above.`);
      }
      await loadQuestions();
    } else if (failCount > 0) {
      toast.error(`Failed to import ${failCount} question(s).`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading questions...</div>
    );
  }

  return (
    <>
      {/* Import Dialog */}
      <ExpertQuestionImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
      />

      {isModalOpen && (
        <ModalShell
          title={mode === 'edit' ? 'Edit Quiz Question' : 'Create Quiz Question'}
          onClose={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          {/* ========== IMAGE UPLOAD SECTION ========== */}
          <div className="md:col-span-2 mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Question Image
            </label>
            {form.imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={form.imagePreview}
                  alt="Question preview"
                  className="max-h-48 rounded-lg border border-border object-contain"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                {isUploading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <span className="text-xs text-muted-foreground/70">PNG, JPG, GIF up to 10MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Case (optional)</label>
              <select
                value={form.caseId}
                onChange={(e) => setForm((p) => ({ ...p, caseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="">-- No Case --</option>
                {isCasesLoading ? <option value="" disabled>Loading cases...</option> : null}
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.categoryName ? `(${c.categoryName})` : ''}
                  </option>
                ))}
              </select>
              {form.caseId && !cases.find(c => c.id === form.caseId) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Selected case is not in your case library. It will remain linked.
                </p>
              )}
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
              disabled={isSaving || isImporting}
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSaving || isImporting || !canSubmit}
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : mode === 'edit' ? 'Update' : 'Create'}
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
                disabled={isSaving || isImporting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isSaving || isImporting}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-destructive hover:bg-destructive/90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Delete'}
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
        <div className="flex gap-2">
          <button
            disabled={isSaving || isImporting}
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Import
          </button>
          <button
            disabled={isSaving || isImporting}
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 cursor-pointer transition-colors"
          >
            + Add Question
          </button>
        </div>
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
                    <div className="min-w-0 flex-1">
                      {/* Hiển thị ảnh nếu có */}
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt="Question"
                          className="max-h-24 rounded-lg border border-border mb-2 object-contain"
                        />
                      )}
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
                        disabled={isSaving || isImporting}
                        onClick={() => openEdit(q)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        disabled={isSaving || isImporting}
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
                disabled={qPage <= 1 || isSaving || isImporting}
                onClick={() => setQPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-input disabled:opacity-40 cursor-pointer transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page <span className="text-card-foreground font-semibold">{qPage}</span> / {qTotalPages}
              </span>
              <button
                disabled={qPage >= qTotalPages || isSaving || isImporting}
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

