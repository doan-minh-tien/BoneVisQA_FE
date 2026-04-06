'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import Header from '@/components/Header';
import { DynamicProgressTracker } from '@/components/shared/DynamicProgressTracker';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  type DocumentDto,
  fetchDocumentStatus,
  fetchDocumentCategories,
  getAdminDocuments,
  fetchDocumentTags,
  uploadAdminDocument,
} from '@/lib/api/admin-documents';
import type { CategoryOption, DocumentStatusResponse, TagOption } from '@/lib/api/types';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

export default function AdminDocumentsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [statusByDocId, setStatusByDocId] = useState<Record<string, DocumentStatusResponse>>({});

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const docs = await getAdminDocuments();
      setDocuments(docs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load uploaded document list.');
    } finally {
      setLoadingDocuments(false);
    }
  }, [toast]);

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

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

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
      setDocumentTitle((prev) => {
        if (prev.trim()) return prev;
        const base = f.name.replace(/\.[^.]+$/, '');
        return base || f.name;
      });
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

  useEffect(() => {
    const processingIds = documents
      .filter((doc) => (doc.indexingStatus ?? '').toLowerCase() === 'processing')
      .map((doc) => doc.id)
      .filter(Boolean);

    if (processingIds.length === 0) return;

    let cancelled = false;

    const poll = async () => {
      await Promise.all(
        processingIds.map(async (id) => {
          try {
            const status = await fetchDocumentStatus(id);
            if (!cancelled) {
              setStatusByDocId((prev) => ({ ...prev, [id]: status }));
            }
          } catch {
            // Ignore intermittent polling errors; next interval can recover.
          }
        }),
      );
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [documents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !categoryId) {
      toast.error('Please select a PDF and a category.');
      return;
    }
    const title = documentTitle.trim();
    if (!title) {
      toast.error('Please enter a document title.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      const res = await uploadAdminDocument({
        file,
        title,
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
      await loadDocuments();
      setFile(null);
      setDocumentTitle('');
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

  const getEffectiveStatus = (doc: DocumentDto): DocumentStatusResponse => {
    const polled = statusByDocId[doc.id];
    if (polled) return polled;
    return {
      status: doc.indexingStatus ?? 'Unknown',
      progressPercentage: (doc.indexingStatus ?? '').toLowerCase() === 'processing' ? 5 : 100,
      currentOperation: (doc.indexingStatus ?? '').toLowerCase() === 'processing' ? 'Starting pipeline...' : '',
    };
  };

  const formatTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
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
            title="Document title"
            description="Shown in the knowledge base and used for indexing metadata."
          >
            <label htmlFor="kb-title" className="block text-sm font-medium text-card-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="kb-title"
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. MSK radiology reference — fractures"
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </SectionCard>

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
              <DynamicProgressTracker
                mode="determinate"
                label="Uploading"
                progressPercentage={progress}
                message="Uploading file to server..."
                className="mt-4"
              />
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
                setDocumentTitle('');
                setCategoryId('');
                setSelectedTagIds(new Set());
              }}
              disabled={submitting}
            >
              Clear
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={loadingMeta || !file || !categoryId || !documentTitle.trim()}
            >
              <Upload className="h-4 w-4" />
              Upload to knowledge base
            </Button>
          </div>
        </form>

        <div className="mt-8">
          <SectionCard
            title="Recent uploads"
            description="Live indexing status from backend polling (every 2 seconds while processing)."
          >
            {loadingDocuments ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading uploaded documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                No uploaded documents found yet.
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => {
                  const status = getEffectiveStatus(doc);
                  const normalized = status.status.toLowerCase();
                  const isProcessing = normalized === 'processing';
                  const isFailed = normalized === 'failed';
                  const isCompleted = normalized === 'completed';

                  return (
                    <article
                      key={doc.id}
                      className="rounded-xl border border-border bg-background/55 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-card-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">Uploaded: {formatTime(doc.createdAt)}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isFailed
                              ? 'bg-destructive/10 text-destructive'
                              : isCompleted
                                ? 'bg-success/10 text-success'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {status.status}
                        </span>
                      </div>

                      {isProcessing ? (
                        <DynamicProgressTracker
                          mode="determinate"
                          label="Indexing progress"
                          progressPercentage={status.progressPercentage}
                          message={status.currentOperation || 'Processing...'}
                          className="mt-3"
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
