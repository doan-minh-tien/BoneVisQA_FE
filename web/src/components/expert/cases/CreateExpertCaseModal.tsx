'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  createExpertCase,
  DB_IMAGE_MODALITIES,
  fetchExpertCategories,
  fetchExpertTags,
  type CreateExpertCaseJsonInput,
  type ExpertCategory,
  type ExpertTag,
} from '@/lib/api/expert-cases';
import type { NormalizedImageBoundingBox } from '@/lib/api/types';
import { isValidNormalizedBoundingBox, serializeNormalizedBoundingBox } from '@/lib/utils/annotations';
import { uploadExpertWorkbenchImage } from '@/lib/supabase/upload-medical-case-image';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { Loader2, ImageIcon, FileText } from 'lucide-react';

const MedicalImageViewer = dynamic(
  () =>
    import('@/components/student/MedicalImageViewer').then((m) => ({
      default: m.MedicalImageViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(360px,50vh)] items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        Loading image viewer…
      </div>
    ),
  },
);

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (caseId: string | undefined) => void;
};

const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

export default function CreateExpertCaseModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [suggestedDiagnosis, setSuggestedDiagnosis] = useState('');
  const [reflectiveQuestions, setReflectiveQuestions] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roiBoundingBox, setRoiBoundingBox] = useState<NormalizedImageBoundingBox | null>(null);
  const [modality, setModality] = useState('');
  const [annotationLabel, setAnnotationLabel] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const metaQuery = useQuery({
    queryKey: ['expert', 'create-case-meta'],
    queryFn: async () => {
      const [cats, tags] = await Promise.all([fetchExpertCategories(), fetchExpertTags(1, 200)]);
      return { categories: cats, tags };
    },
    enabled: open,
  });

  const categories: ExpertCategory[] = metaQuery.data?.categories ?? [];
  const tags: ExpertTag[] = metaQuery.data?.tags ?? [];

  useEffect(() => {
    if (open && categories.length > 0) {
      setCategoryId((id) => id || categories[0].id);
    }
  }, [open, categories]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpertCaseJsonInput) => createExpertCase(payload),
    onSuccess: (newId) => {
      toast.success('Case created successfully.');
      void queryClient.invalidateQueries({ queryKey: ['expert', 'create-case-meta'] });
      reset();
      onClose();
      onCreated(newId);
    },
    onError: (err: Error) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create case');
    },
  });

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id ?? '');
    setDifficulty('Medium');
    setSuggestedDiagnosis('');
    setReflectiveQuestions('');
    setKeyFindings('');
    setSelectedTagIds(new Set());
    setFile(null);
    setRoiBoundingBox(null);
    setModality('');
    setAnnotationLabel('');
    setUploadingImage(false);
  };

  const handleClose = () => {
    if (!createMutation.isPending && !uploadingImage) {
      reset();
      onClose();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 100 MB or smaller.');
      return;
    }
    setFile(f);
    setRoiBoundingBox(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required.');
      return;
    }

    let medicalImages: CreateExpertCaseJsonInput['medicalImages'];
    if (file) {
      setUploadingImage(true);
      try {
        const imageUrl = await uploadExpertWorkbenchImage(file);
        const coordinates = serializeNormalizedBoundingBox(roiBoundingBox);
        const trimmedLabel = annotationLabel.trim();
        const annotations =
          coordinates != null && coordinates !== ''
            ? trimmedLabel
              ? [{ label: trimmedLabel, coordinates }]
              : [{ coordinates }]
            : [];
        medicalImages = [
          {
            id: '',
            imageUrl,
            modality: modality.trim() || null,
            annotations,
          },
        ];
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Image upload failed');
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      categoryId: categoryId.trim() || null,
      suggestedDiagnosis: suggestedDiagnosis.trim() || null,
      reflectiveQuestions: reflectiveQuestions.trim() || null,
      keyFindings: keyFindings.trim() || null,
      tagIds: selectedTagIds.size > 0 ? Array.from(selectedTagIds) : null,
      medicalImages: medicalImages ?? null,
    });
  };

  const loadingMeta = metaQuery.isPending;
  const busy = createMutation.isPending || uploadingImage;

  return (
    <Modal open={open} onClose={handleClose} title="Create teaching case" size="2xl">
      <p className="text-sm text-muted-foreground">
        Optional image upload to Supabase, then JSON to the API. ROI uses normalized{' '}
        <code className="rounded bg-muted px-1 text-xs">{'{ x, y, width, height }'}</code> like Visual QA. Modality values
        must match DB: X-Ray, CT, MRI, Ultrasound, Other.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            file ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground',
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          Imaging
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Case metadata
        </span>
      </div>

          {loadingMeta ? (
            <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : metaQuery.isError ? (
            <p className="mt-6 text-sm text-destructive">
              {metaQuery.error instanceof Error ? metaQuery.error.message : 'Failed to load form data'}
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex min-h-0 flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Imaging file (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={busy}
                      onChange={onFileChange}
                      className="w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                    />
                    {file ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Text-only cases are allowed; skip the file to omit medicalImages.</p>
                    )}
                  </div>
                  {file ? (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Modality</label>
                        <select
                          value={modality}
                          onChange={(e) => setModality(e.target.value)}
                          disabled={busy}
                          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">— Default (Other) —</option>
                          {DB_IMAGE_MODALITIES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">ROI label</label>
                        <input
                          value={annotationLabel}
                          onChange={(e) => setAnnotationLabel(e.target.value)}
                          disabled={busy}
                          placeholder="Optional — backend can use finding if empty"
                          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="min-h-[min(360px,45vh)] overflow-hidden rounded-xl border border-border bg-muted/20">
                        <MedicalImageViewer
                          key={previewUrl ?? 'empty'}
                          src={previewUrl}
                          alt="Case imaging for annotation"
                          initialAnnotation={roiBoundingBox ?? undefined}
                          onAnnotationComplete={setRoiBoundingBox}
                        />
                      </div>
                      {roiBoundingBox && isValidNormalizedBoundingBox(roiBoundingBox) ? (
                        <p className="text-xs text-muted-foreground">
                          Rectangle ROI · coordinates serialized as normalized x, y, width, height (matches Visual QA).
                        </p>
                      ) : file ? (
                        <p className="text-xs text-muted-foreground">
                          Optional: use the square tool and click-drag on the image to set a bounding box.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={busy}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Case title"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={busy}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— None —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                      disabled={busy}
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
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={busy}
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
                      disabled={busy}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Key findings</label>
                    <textarea
                      value={keyFindings}
                      onChange={(e) => setKeyFindings(e.target.value)}
                      disabled={busy}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Reflective questions</label>
                    <textarea
                      value={reflectiveQuestions}
                      onChange={(e) => setReflectiveQuestions(e.target.value)}
                      disabled={busy}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {tags.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Tags (optional)</p>
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
                        {tags.map((t) => (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTagIds.has(t.id)}
                              onChange={() => toggleTag(t.id)}
                              disabled={busy}
                              className="rounded border-border"
                            />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={busy}
                      className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          {uploadingImage ? 'Uploading image…' : 'Creating…'}
                        </>
                      ) : (
                        'Create case'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
    </Modal>
  );
}
