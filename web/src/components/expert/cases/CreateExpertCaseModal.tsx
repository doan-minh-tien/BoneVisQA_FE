'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  createExpertCase,
  fetchExpertCategories,
  type ExpertCategory,
  type SaveExpertCaseInput,
} from '@/lib/api/expert-cases';
import { fetchExpertProfile } from '@/lib/api/lecturer-dashboard';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with new case id when API returns one; otherwise undefined (list still refreshes). */
  onCreated: (caseId: string | undefined) => void;
};

export default function CreateExpertCaseModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ExpertCategory[]>([]);
  const [expertId, setExpertId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<SaveExpertCaseInput['difficulty']>('Medium');
  const [suggestedDiagnosis, setSuggestedDiagnosis] = useState('');
  const [reflectiveQuestions, setReflectiveQuestions] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    Promise.all([fetchExpertCategories(), fetchExpertProfile()])
      .then(([cats, profile]) => {
        setCategories(cats);
        setExpertId(profile.id);
        if (cats.length > 0) setCategoryId((id) => id || cats[0].id);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : 'Failed to load form data');
      })
      .finally(() => setLoadingMeta(false));
  }, [open, toast]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id ?? '');
    setDifficulty('Medium');
    setSuggestedDiagnosis('');
    setReflectiveQuestions('');
    setKeyFindings('');
    setIsActive(true);
    setIsApproved(false);
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertId.trim()) {
      toast.error('Missing expert profile. Please sign in again.');
      return;
    }
    if (!categoryId.trim()) {
      toast.error('Please select a category.');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    const input: SaveExpertCaseInput = {
      title: title.trim(),
      createdByExpertId: expertId.trim(),
      description: description.trim(),
      difficulty,
      isApproved,
      isActive,
      categoryId: categoryId.trim(),
      suggestedDiagnosis: suggestedDiagnosis.trim(),
      reflectiveQuestions: reflectiveQuestions.trim(),
      keyFindings: keyFindings.trim(),
    };
    setSubmitting(true);
    try {
      const newId = await createExpertCase(input);
      toast.success('Case created successfully.');
      reset();
      onClose();
      onCreated(newId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={handleClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-case-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 id="create-case-title" className="text-lg font-semibold text-card-foreground">
          Create medical case
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Save the case first, then add tags and imaging in the next step.
        </p>

        {loadingMeta ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Case title"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.length === 0 ? (
                  <option value="">No categories — check API</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as SaveExpertCaseInput['difficulty'])}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Clinical summary for learners"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Suggested diagnosis</label>
              <input
                value={suggestedDiagnosis}
                onChange={(e) => setSuggestedDiagnosis(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Key findings</label>
              <textarea
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Reflective questions</label>
              <textarea
                value={reflectiveQuestions}
                onChange={(e) => setReflectiveQuestions(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={isApproved} onChange={(e) => setIsApproved(e.target.checked)} />
                Approved
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !categoryId}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create case'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
