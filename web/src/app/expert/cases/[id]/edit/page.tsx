'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSWRConfig } from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchExpertCase,
  fetchExpertCategories,
  updateExpertCase,
  type ExpertCategory,
  type SaveExpertCaseInput,
} from '@/lib/api/expert-cases';
import { getApiProblemDetails } from '@/lib/api/client';
import { fetchExpertProfile } from '@/lib/api/lecturer-dashboard';
import { Loader2 } from 'lucide-react';

export default function ExpertCaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { mutate: swrMutate } = useSWRConfig();
  const id = String(params?.id ?? '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<SaveExpertCaseInput['difficulty']>('Medium');
  const [suggestedDiagnosis, setSuggestedDiagnosis] = useState('');
  const [reflectiveQuestions, setReflectiveQuestions] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const caseQuery = useQuery({
    queryKey: ['expert', 'case', id],
    queryFn: () => fetchExpertCase(id),
    enabled: Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ['expert', 'categories'],
    queryFn: fetchExpertCategories,
  });

  const profileQuery = useQuery({
    queryKey: ['expert', 'profile'],
    queryFn: fetchExpertProfile,
  });

  useEffect(() => {
    const c = caseQuery.data;
    if (!c) return;
    setTitle(c.title);
    setDescription(c.description);
    setCategoryId(c.categoryId || '');
    setDifficulty(c.difficulty);
    setSuggestedDiagnosis(c.suggestedDiagnosis);
    setReflectiveQuestions(c.reflectiveQuestions);
    setKeyFindings(c.keyFindings);
    setIsActive(c.isActive);
    setIsApproved(c.isApproved);
  }, [caseQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: SaveExpertCaseInput) => updateExpertCase(id, payload),
    onSuccess: () => {
      toast.success('Case updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['expert', 'case', id] });
      void queryClient.invalidateQueries({ queryKey: ['expert', 'cases'] });
      void swrMutate('expert-case-library');
      void swrMutate('expert-dashboard');
      router.push(`/expert/cases/${id}`);
    },
    onError: (err: unknown) => {
      const { title: errTitle, detail } = getApiProblemDetails(err);
      toast.error(detail ? `${errTitle}: ${detail}` : errTitle);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expertId = profileQuery.data?.id?.trim();
    if (!expertId) {
      toast.error('Missing expert profile. Please sign in again.');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!categoryId.trim()) {
      toast.error('Please select a category.');
      return;
    }
    updateMutation.mutate({
      title: title.trim(),
      createdByExpertId: expertId,
      description: description.trim(),
      difficulty,
      isApproved,
      isActive,
      categoryId: categoryId.trim(),
      suggestedDiagnosis: suggestedDiagnosis.trim(),
      reflectiveQuestions: reflectiveQuestions.trim(),
      keyFindings: keyFindings.trim(),
    });
  };

  const loading = caseQuery.isPending || categoriesQuery.isPending || profileQuery.isPending;
  const categories: ExpertCategory[] = categoriesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Edit case"
        subtitle={caseQuery.data?.title ? caseQuery.data.title : 'Update case metadata'}
      />
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6 sm:px-6">
        {caseQuery.isError ? (
          <p className="text-sm text-destructive">
            {caseQuery.error instanceof Error ? caseQuery.error.message : 'Could not load case.'}
          </p>
        ) : loading ? (
          <PageLoadingSkeleton>
            <SkeletonBlock className="h-10 w-full rounded-lg" />
            <SkeletonBlock className="mt-4 h-10 w-full rounded-lg" />
            <SkeletonBlock className="mt-4 h-32 w-full rounded-lg" />
          </PageLoadingSkeleton>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {caseQuery.data?.categoryId &&
                !categories.some((c) => c.id === caseQuery.data.categoryId) ? (
                  <option value={caseQuery.data.categoryId}>{caseQuery.data.categoryName || 'Current category'}</option>
                ) : null}
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
              <label className="flex cursor-pointer items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-card-foreground">
                <input type="checkbox" checked={isApproved} onChange={(e) => setIsApproved(e.target.checked)} />
                Approved
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => router.push(`/expert/cases/${id}`)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 cursor-pointer gap-2" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
