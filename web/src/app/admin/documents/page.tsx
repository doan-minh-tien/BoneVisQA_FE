'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchDocumentCategories,
  fetchDocumentTags,
  uploadAdminDocument,
} from '@/lib/api/admin-documents';
import type { CategoryOption, TagOption } from '@/lib/api/types';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

export default function AdminDocumentsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, t] = await Promise.all([fetchDocumentCategories(), fetchDocumentTags()]);
        if (cancelled) return;
        setCategories(c.filter((x) => x.id));
        setTags(t.filter((x) => x.id));
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : 'Could not load categories or tags. Check API routes.',
          );
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      if (f.size > MAX_BYTES) {
        toast.error('File exceeds the maximum size of 50MB.');
        return;
      }
      setFile(f);
      setProgress(0);
    },
    [toast],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      for (const r of rejections) {
        for (const err of r.errors) {
          if (err.code === 'file-too-large') {
            toast.error('Uploaded file exceeds the 50MB limit. Please choose a smaller file.');
            return;
          }
        }
      }
      toast.error('File type not accepted. Please upload a PDF.');
    },
    [toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxSize: MAX_BYTES,
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !categoryId) {
      toast.error('Please select a PDF and a category.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      const res = await uploadAdminDocument({
        file,
        categoryId,
        tagIds: Array.from(selectedTagIds),
        onUploadProgress: setProgress,
      });
      const status = res.indexingStatus ?? '';
      if (status.toLowerCase() === 'processing') {
        toast.success('Upload accepted. Indexing is processing.');
      } else if (status) {
        toast.info(`Upload complete. Indexing status: ${status}`);
      } else {
        toast.success('Document uploaded successfully.');
      }
      setFile(null);
      setCategoryId('');
      setSelectedTagIds(new Set());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Knowledge Base Upload"
        subtitle="Upload large medical PDFs for indexing and RAG retrieval"
      />
      <div className="mx-auto max-w-4xl p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <SectionCard
            title="Document file"
            description="PDF only. Single-file upload is enforced for backend chunking stability, with a hard limit of 50MB."
          >
            {!file ? (
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-input/20 hover:bg-input/40'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-center text-sm font-medium text-card-foreground">
                  Drag and drop a medical PDF here
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  or click to browse your local device
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/65 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-card-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB selected
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFile(null)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
            {submitting && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Classification" description="Choose the backend category and any supporting tags before upload.">
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-card-foreground">
                  Category
                </label>
                <select
                  id="category"
                  required
                  disabled={loadingMeta}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">
                    {loadingMeta ? 'Loading categories...' : 'Select a document category'}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!loadingMeta && categories.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No categories are currently available from the backend.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-card-foreground">Tags (multi-select)</p>
              <p className="text-xs text-muted-foreground">Choose any tags that should improve retrieval precision.</p>
              {loadingMeta ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading tags...
                </div>
              ) : tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-3">
                {tags.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-input/40 px-3 py-2 text-sm hover:bg-input/70"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.has(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span>{t.name}</span>
                  </label>
                ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  The backend returned no tags for selection yet.
                </div>
              )}
            </div>
          </SectionCard>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFile(null);
                setCategoryId('');
                setSelectedTagIds(new Set());
              }}
              disabled={submitting}
            >
              Clear
            </Button>
            <Button type="submit" isLoading={submitting} disabled={loadingMeta || !file || !categoryId}>
              <Upload className="h-4 w-4" />
              Upload to knowledge base
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
