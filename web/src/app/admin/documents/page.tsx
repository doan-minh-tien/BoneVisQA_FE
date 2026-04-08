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
import { CheckCircle2, FileText, Loader2, Trash2, Upload, XCircle } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

type UploadRowStatus = 'queued' | 'uploading' | 'success' | 'failed';

type UploadRow = {
  id: string;
  file: File;
  progress: number;
  status: UploadRowStatus;
  error?: string;
};

function newRowId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AdminDocumentsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadRow[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      const nextRows: UploadRow[] = [];
      for (const f of accepted) {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name}: exceeds the maximum size of 50MB.`);
          continue;
        }
        nextRows.push({ id: newRowId(), file: f, progress: 0, status: 'queued' });
      }
      if (nextRows.length === 0) return;
      setUploadQueue((prev) => [...prev, ...nextRows]);
      setDocumentTitle((prev) => {
        if (prev.trim()) return prev;
        const first = nextRows[0]?.file;
        if (!first) return prev;
        const base = first.name.replace(/\.[^.]+$/, '');
        return base || first.name;
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
    maxFiles: 25,
    multiple: true,
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

  const resolveTitleForFile = (file: File, index: number, total: number) => {
    const base = documentTitle.trim();
    if (total === 1) {
      return base || file.name.replace(/\.[^.]+$/, '') || file.name;
    }
    if (base) return `${base} — ${file.name}`;
    return file.name.replace(/\.[^.]+$/, '') || file.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadQueue.length === 0 || !categoryId) {
      toast.error('Please add at least one PDF and select a category.');
      return;
    }
    if (!documentTitle.trim() && uploadQueue.length > 1) {
      toast.error('Please enter a document title (used as a prefix when uploading multiple files).');
      return;
    }
    const tagIds = Array.from(selectedTagIds);
    const totalFiles = uploadQueue.length;
    setSubmitting(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const row = uploadQueue[i];
      if (row.status === 'success') continue;

      const title = resolveTitleForFile(row.file, i, uploadQueue.length);

      setUploadQueue((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: 'uploading' as const, progress: 0, error: undefined } : r,
        ),
      );

      try {
        const res = await uploadAdminDocument({
          file: row.file,
          title,
          categoryId,
          tagIds,
          onUploadProgress: (pct) => {
            setUploadQueue((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, progress: Math.min(100, pct) } : r)),
            );
          },
        });
        successCount += 1;
        const status = res.indexingStatus ?? '';
        setUploadQueue((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: 'success' as const, progress: 100 } : r,
          ),
        );
        if (totalFiles === 1) {
          if (status.toLowerCase() === 'processing') {
            toast.success('Upload accepted. Indexing is processing.');
          } else if (status) {
            toast.info(`Upload complete. Indexing status: ${status}`);
          } else {
            toast.success('Document uploaded successfully.');
          }
        }
      } catch (err) {
        failCount += 1;
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setUploadQueue((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: 'failed' as const, progress: 0, error: msg } : r)),
        );
        toast.error(`${row.file.name}: ${msg}`);
      }
    }

    await loadDocuments();

    if (totalFiles > 1) {
      if (failCount === 0) {
        toast.success(`${successCount} document(s) uploaded. Indexing will continue in the background.`);
      } else if (successCount > 0) {
        toast.info(`Completed with ${successCount} success and ${failCount} failure(s).`);
      }
    }

    if (failCount === 0) {
      setUploadQueue([]);
      setDocumentTitle('');
      setCategoryId('');
      setSelectedTagIds(new Set());
    }

    setSubmitting(false);
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
            title="Document files"
            description="PDF only, up to 25 files per batch. Each file uploads with its own progress bar (50MB max per file)."
          >
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-input/20 hover:bg-input/40'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-center text-sm font-medium text-card-foreground">
                Drag and drop medical PDFs here
              </p>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                or click to browse — multiple files allowed
              </p>
            </div>

            {uploadQueue.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {uploadQueue.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-border bg-background/65 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-card-foreground">{row.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(row.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-150 ${
                                row.status === 'failed' ? 'bg-destructive' : 'bg-primary'
                              }`}
                              style={{ width: `${row.progress}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {row.status === 'queued' && 'Queued'}
                            {row.status === 'uploading' && `Uploading… ${row.progress}%`}
                            {row.status === 'success' && 'Uploaded'}
                            {row.status === 'failed' && (row.error ?? 'Failed')}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {row.status === 'uploading' || row.status === 'queued' ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Uploading" />
                        ) : null}
                        {row.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" aria-label="Success" />
                        ) : null}
                        {row.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-destructive" aria-label="Failed" />
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadQueue((prev) => prev.filter((r) => r.id !== row.id));
                          }}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
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
                setUploadQueue([]);
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
              disabled={
                loadingMeta ||
                uploadQueue.length === 0 ||
                !categoryId ||
                (uploadQueue.length > 1 && !documentTitle.trim())
              }
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
