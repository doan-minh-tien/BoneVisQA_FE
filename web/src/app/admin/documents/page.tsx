'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import AdminDocumentsUploadModal from '@/components/admin/documents/AdminDocumentsUploadModal';
import AdminDocumentReplaceFileModal from '@/components/admin/documents/AdminDocumentReplaceFileModal';
import { DocumentIndexingCell } from '@/components/admin/documents/DocumentIndexingCell';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  type DocumentDto,
  documentListHasProcessing,
  documentListNeedsActivePolling,
  fetchDocumentCategories,
  fetchDocumentStatus,
  fetchDocumentTags,
  getDocuments,
  normalizeIndexingStatus,
} from '@/lib/api/admin-documents';
import { resolveApiAssetUrl, withVersionedAssetUrl } from '@/lib/api/client';
import type { CategoryOption, DocumentIngestionStatusDto, DocumentStatusResponse, TagOption } from '@/lib/api/types';
import {
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [statusByDocId, setStatusByDocId] = useState<Record<string, DocumentStatusResponse>>({});
  const [replaceTarget, setReplaceTarget] = useState<{ id: string; title: string } | null>(null);
  const [openingReplaceId, setOpeningReplaceId] = useState<string | null>(null);

  const loadDocuments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingDocuments(true);
      try {
        const docs = await getDocuments({
          search: search.trim() || undefined,
          categoryId: categoryFilter || undefined,
          indexingStatus: statusFilter || undefined,
        });
        setDocuments(docs);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Unable to load document list.');
      } finally {
        if (!opts?.silent) setLoadingDocuments(false);
      }
    },
    [toast, search, categoryFilter, statusFilter],
  );

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
          toast.error(e instanceof Error ? e.message : 'Unable to load categories/tags.');
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

  useEffect(() => {
    const onIndexing = (ev: Event) => {
      const d = (ev as CustomEvent<DocumentIngestionStatusDto>).detail;
      const s = String(d?.status ?? '').toLowerCase();
      if (s === 'completed' || s === 'failed') {
        void loadDocuments({ silent: true });
        void queryClient.invalidateQueries();
      }
    };
    window.addEventListener('DocumentIndexingProgressUpdated', onIndexing);
    return () => window.removeEventListener('DocumentIndexingProgressUpdated', onIndexing);
  }, [loadDocuments, queryClient]);

  const listPollMs = useMemo(() => {
    if (!documentListNeedsActivePolling(documents)) return 0;
    return documentListHasProcessing(documents) ? 3000 : 5000;
  }, [documents]);

  useEffect(() => {
    if (listPollMs === 0) return;
    const id = window.setInterval(() => {
      void loadDocuments({ silent: true });
    }, listPollMs);
    return () => window.clearInterval(id);
  }, [listPollMs, loadDocuments]);

  useEffect(() => {
    const activeIds = documents
      .filter((d) => {
        const n = normalizeIndexingStatus(d.indexingStatus);
        return n === 'pending' || n === 'processing';
      })
      .map((d) => d.id)
      .filter(Boolean);
    if (activeIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      await Promise.all(
        activeIds.map(async (docId) => {
          try {
            const s = await fetchDocumentStatus(docId);
            if (!cancelled) {
              setStatusByDocId((prev) => ({ ...prev, [docId]: s }));
            }
          } catch {
            /* transient */
          }
        }),
      );
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [documents]);

  const pollActive = useMemo(() => documentListNeedsActivePolling(documents), [documents]);
  const hasProcessing = useMemo(() => documentListHasProcessing(documents), [documents]);
  const effectiveStatusByDocId = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of documents) {
      map.set(d.id, statusByDocId[d.id]?.status ?? d.indexingStatus);
    }
    return map;
  }, [documents, statusByDocId]);
  const hasAnyProcessingLive = useMemo(
    () =>
      Array.from(effectiveStatusByDocId.values()).some(
        (status) => normalizeIndexingStatus(status) === 'processing',
      ),
    [effectiveStatusByDocId],
  );

  const sectionDescription = useMemo(() => {
    if (!pollActive) {
      return 'No active indexing jobs. Refreshes run on user actions or after uploads.';
    }
    if (hasProcessing) {
      return 'List refreshes every 3 seconds while documents are Processing. Page progress updates every 3 seconds.';
    }
    return 'List refreshes every 5 seconds while documents are Pending.';
  }, [pollActive, hasProcessing]);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (q && !(d.title ?? '').toLowerCase().includes(q)) return false;
      if (categoryFilter && (d.categoryId ?? '') !== categoryFilter) return false;
      if (statusFilter) {
        const status = normalizeIndexingStatus(d.indexingStatus);
        if (status !== normalizeIndexingStatus(statusFilter)) return false;
      }
      return true;
    });
  }, [documents, search, categoryFilter, statusFilter]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const formatCreated = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Knowledge Base"
        subtitle="Manage RAG documents with real-time indexing status."
      />
      <div className="mx-auto max-w-6xl p-6">
        <SectionCard title="Documents" description={sectionDescription}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loadingMeta}
                className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <Button type="button" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            {loadingDocuments ? (
              <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading documents...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                No matching documents. Try changing filters or upload a new file.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Document</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Indexing</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Version</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocuments.map((doc) => {
                      const liveStatus =
                        effectiveStatusByDocId.get(doc.id) ?? statusByDocId[doc.id]?.status ?? doc.indexingStatus;
                      const normalized = normalizeIndexingStatus(liveStatus);
                      const interactionLocked =
                        normalized === 'pending' || normalized === 'processing';
                      const showQueueHint = normalized === 'pending' && hasAnyProcessingLive;
                      return (
                      <tr key={doc.id} className="group hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-card-foreground">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/documents/${doc.id}`}
                                className="block truncate font-semibold text-foreground hover:text-primary"
                              >
                                {doc.title}
                              </Link>
                              {doc.isOutdated ? (
                                <span className="mt-1 inline-block rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                                  Outdated
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {doc.categoryId
                            ? categoryNameById.get(doc.categoryId) ?? doc.categoryId
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex justify-center">
                            <DocumentIndexingCell
                              doc={doc}
                              statusDetail={statusByDocId[doc.id] ?? null}
                              showQueueHint={showQueueHint}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {doc.version != null ? `v${doc.version}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{formatCreated(doc.createdAt)}</td>
                        <td className="px-4 py-3 align-middle text-center">
                          <div className="flex flex-row flex-nowrap items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={interactionLocked}
                              onClick={() => router.push(`/admin/documents/${doc.id}`)}
                            >
                              Details
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title={interactionLocked ? 'Actions are locked while indexing is in progress.' : 'Replace file'}
                              disabled={interactionLocked || openingReplaceId === doc.id}
                              onClick={() => {
                                setOpeningReplaceId(doc.id);
                                setReplaceTarget({ id: doc.id, title: doc.title });
                                window.setTimeout(() => {
                                  setOpeningReplaceId((prev) => (prev === doc.id ? null : prev));
                                }, 350);
                              }}
                            >
                              {openingReplaceId === doc.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileUp className="h-3.5 w-3.5" />
                              )}
                              Update
                            </Button>
                            {doc.filePath ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={interactionLocked}
                                onClick={() => {
                                  const href = withVersionedAssetUrl(
                                    resolveApiAssetUrl(doc.filePath),
                                    doc.version,
                                  );
                                  window.open(href, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <AdminDocumentsUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => void loadDocuments()}
        categories={categories}
        tags={tags}
        loadingMeta={loadingMeta}
      />

      <AdminDocumentReplaceFileModal
        open={replaceTarget != null}
        documentId={replaceTarget?.id ?? ''}
        documentTitle={replaceTarget?.title ?? ''}
        onClose={() => setReplaceTarget(null)}
        onSuccess={() => void loadDocuments()}
      />
    </div>
  );
}
