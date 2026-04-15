'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  reindexAdminDocument,
} from '@/lib/api/admin-documents';
import type { CategoryOption, DocumentStatusResponse, TagOption } from '@/lib/api/types';
import {
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function AdminDocumentsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [statusByDocId, setStatusByDocId] = useState<Record<string, DocumentStatusResponse>>({});
  const [replaceTarget, setReplaceTarget] = useState<{ id: string; title: string } | null>(null);

  const loadDocuments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingDocuments(true);
      try {
        const docs = await getDocuments({
          categoryId: categoryFilter || undefined,
          indexingStatus: statusFilter || undefined,
        });
        setDocuments(docs);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Không tải được danh sách tài liệu.');
      } finally {
        if (!opts?.silent) setLoadingDocuments(false);
      }
    },
    [toast, categoryFilter, statusFilter],
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
          toast.error(e instanceof Error ? e.message : 'Không tải danh mục / thẻ.');
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
    const processingIds = documents
      .filter((d) => normalizeIndexingStatus(d.indexingStatus) === 'processing')
      .map((d) => d.id)
      .filter(Boolean);
    if (processingIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      await Promise.all(
        processingIds.map(async (docId) => {
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

  const sectionDescription = useMemo(() => {
    if (!pollActive) {
      return 'Không có tài liệu đang xử lý — làm mới theo thao tác hoặc khi tải lên mới.';
    }
    if (hasProcessing) {
      return 'Danh sách làm mới mỗi 3 giây khi có bản ghi Đang lập chỉ mục; tiến trình theo trang cập nhật mỗi 3 giây. Chỉ còn Chờ xử lý: 5 giây.';
    }
    return 'Đang làm mới danh sách mỗi 5 giây khi có tài liệu Chờ xử lý.';
  }, [pollActive, hasProcessing]);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => (d.title ?? '').toLowerCase().includes(q));
  }, [documents, search]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const handleReindex = async (docId: string) => {
    setReindexingId(docId);
    try {
      await reindexAdminDocument(docId);
      toast.success('Đã lập lại chỉ mục — trạng thái sẽ cập nhật sau vài giây.');
      await loadDocuments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lập lại chỉ mục thất bại.');
    } finally {
      setReindexingId(null);
    }
  };

  const formatCreated = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Knowledge Base"
        subtitle="Quản lý tài liệu RAG — theo dõi trạng thái lập chỉ mục theo thời gian thực"
      />
      <div className="mx-auto max-w-6xl p-6">
        <SectionCard title="Tài liệu" description={sectionDescription}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Tìm theo tiêu đề…"
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
                <option value="">Tất cả danh mục</option>
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
                <option value="">Mọi trạng thái lập chỉ mục</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <Button type="button" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Tải lên
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            {loadingDocuments ? (
              <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Đang tải danh sách…
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                Không có tài liệu phù hợp. Thử đổi bộ lọc hoặc tải lên tài liệu mới.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Tài liệu</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Danh mục</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Lập chỉ mục</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Phiên bản</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Tạo lúc</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocuments.map((doc) => (
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
                                <span className="mt-1 inline-block rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                                  Lỗi thời
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {doc.categoryId
                            ? categoryNameById.get(doc.categoryId) ?? doc.categoryId
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <DocumentIndexingCell
                            doc={doc}
                            statusDetail={statusByDocId[doc.id] ?? null}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {doc.version != null ? `v${doc.version}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatCreated(doc.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`/admin/documents/${doc.id}`}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-all hover:bg-slate-50"
                            >
                              Chi tiết
                            </Link>
                            <button
                              type="button"
                              title="Cập nhật tệp"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                              onClick={() => setReplaceTarget({ id: doc.id, title: doc.title })}
                            >
                              <FileUp className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Cập nhật tệp</span>
                            </button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={reindexingId === doc.id}
                              onClick={() => void handleReindex(doc.id)}
                            >
                              {reindexingId === doc.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Lập lại chỉ mục
                            </Button>
                            {doc.filePath ? (
                              <a
                                href={doc.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                                title="Mở tệp"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
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
