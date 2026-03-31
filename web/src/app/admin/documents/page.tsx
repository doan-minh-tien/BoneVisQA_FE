'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchDocumentCategories,
  fetchDocumentTags,
  uploadAdminDocument,
} from '@/lib/api/admin-documents';
import type { CategoryOption, TagOption } from '@/lib/api/types';
import { FileText, Upload, X } from 'lucide-react';

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
    },
    [toast],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      for (const r of rejections) {
        for (const err of r.errors) {
          if (err.code === 'file-too-large') {
            toast.error('File tải lên vượt quá giới hạn 50MB. Vui lòng chọn tệp nhỏ hơn.');
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
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Document file
            </h2>
            <p className="mt-1 text-sm text-card-foreground">
              PDF only · Maximum <strong>50MB</strong> (enforced client- and server-side)
            </p>
            <div
              {...getRootProps()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-input/20 hover:bg-input/40'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-center text-sm font-medium text-card-foreground">
                Drag and drop a medical PDF here
              </p>
              <p className="mt-1 text-center text-xs text-muted-foreground">or click to browse</p>
            </div>
            {file && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-input/30 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-card-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
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
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Classification
            </h2>
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
                  <option value="">Select CategoryId…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-card-foreground">Tags (multi-select)</p>
              <p className="text-xs text-muted-foreground">Choose one or more TagIds</p>
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
              {tags.length === 0 && !loadingMeta && (
                <p className="mt-2 text-xs text-muted-foreground">No tags returned from API.</p>
              )}
            </div>
          </section>

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
            <Button type="submit" isLoading={submitting} disabled={loadingMeta}>
              <Upload className="h-4 w-4" />
              Upload to knowledge base
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
