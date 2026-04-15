'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchDocumentStatus,
  getDocuments,
  getAdminDocumentById,
  normalizeIndexingStatus,
  reindexAdminDocument,
  type AdminDocumentDetail,
} from '@/lib/api/admin-documents';
import { resolveApiAssetUrl, withVersionedAssetUrl } from '@/lib/api/client';
import type { DocumentIngestionStatusDto } from '@/lib/api/types';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileUp,
  RefreshCw,
  XCircle,
  Calendar,
  FolderOpen,
  ExternalLink,
  Download,
  DatabaseZap,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminDocumentReplaceFileModal from './AdminDocumentReplaceFileModal';

type IngestionSnapshot = {
  status?: string;
  currentPageIndexing?: number;
  totalPages?: number;
  totalChunks?: number;
  currentOperation?: string;
  source: 'rest' | 'signalr';
};

function asNonNegInt(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Math.floor(value);
}

export default function DocumentDetail({ id }: { id: string }) {
  const [doc, setDoc] = useState<AdminDocumentDetail | null>(null);
  const [liveStatus, setLiveStatus] = useState<IngestionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [hasOtherProcessingTask, setHasOtherProcessingTask] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [reindexMessage, setReindexMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const applyIngestionSnapshot = (
    next: Omit<IngestionSnapshot, 'source'> & { source: IngestionSnapshot['source'] },
  ) => {
    setLiveStatus((prev) => {
      if (!prev) return next;
      const prevCur = asNonNegInt(prev.currentPageIndexing) ?? 0;
      const nextCur = asNonNegInt(next.currentPageIndexing) ?? 0;

      // Race-safe rule: if realtime has higher progress, keep it over stale REST.
      if (next.source === 'rest' && prev.source === 'signalr' && prevCur > nextCur) {
        return {
          ...next,
          currentPageIndexing: prev.currentPageIndexing,
          source: prev.source,
        };
      }

      if (next.source === 'signalr' && nextCur < prevCur) {
        return {
          ...next,
          currentPageIndexing: prev.currentPageIndexing,
        };
      }
      return next;
    });
  };

  useEffect(() => {
    let disposed = false;
    const fetchInitialState = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, status] = await Promise.all([getAdminDocumentById(id), fetchDocumentStatus(id)]);
        if (disposed) return;
        setDoc(data);
        applyIngestionSnapshot({
          source: 'rest',
          status: status.status || data.indexingStatus,
          currentPageIndexing: status.currentPageIndexing ?? data.currentPageIndexing,
          totalPages: status.totalPages ?? data.totalPages,
          totalChunks: status.totalChunks,
          currentOperation: status.currentOperation,
        });
      } catch (err: unknown) {
        if (disposed) return;
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document details');
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void fetchInitialState();
    return () => {
      disposed = true;
    };
  }, [id]);

  const effectiveStatus = liveStatus?.status ?? doc?.indexingStatus;
  const isReindexingStatus = (effectiveStatus ?? '').toLowerCase().includes('reindex');
  const normalizedStatus = useMemo(
    () => normalizeIndexingStatus(effectiveStatus),
    [effectiveStatus],
  );

  useEffect(() => {
    if (!doc || (normalizedStatus !== 'pending' && normalizedStatus !== 'processing')) return;
    let disposed = false;
    const run = async () => {
      try {
        const status = await fetchDocumentStatus(id);
        if (disposed) return;
        applyIngestionSnapshot({
          source: 'rest',
          status: status.status,
          currentPageIndexing: status.currentPageIndexing,
          totalPages: status.totalPages,
          totalChunks: status.totalChunks,
          currentOperation: status.currentOperation,
        });
        setDoc((prev) =>
          prev
            ? {
                ...prev,
                indexingStatus: status.status || prev.indexingStatus,
                currentPageIndexing: status.currentPageIndexing ?? prev.currentPageIndexing,
                totalPages: status.totalPages ?? prev.totalPages,
                indexingProgressPercentage:
                  status.progressPercentage ?? prev.indexingProgressPercentage,
              }
            : prev,
        );
      } catch {
        // Keep UI responsive even if a status poll fails transiently.
      }
    };

    void run();
    const timer = window.setInterval(run, 3000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [doc, id, normalizedStatus]);

  useEffect(() => {
    const onRealtimeProgress = (event: Event) => {
      const custom = event as CustomEvent<DocumentIngestionStatusDto>;
      const payload = custom.detail;
      if (!payload || (payload.documentId && payload.documentId !== id)) return;
      applyIngestionSnapshot({
        source: 'signalr',
        status: payload.status,
        currentPageIndexing: asNonNegInt(payload.currentPageIndexing),
        totalPages: asNonNegInt(payload.totalPages),
        totalChunks: asNonNegInt(payload.totalChunks),
        currentOperation: payload.operation,
      });
    };

    window.addEventListener('DocumentIndexingProgressUpdated', onRealtimeProgress as EventListener);
    return () => {
      window.removeEventListener(
        'DocumentIndexingProgressUpdated',
        onRealtimeProgress as EventListener,
      );
    };
  }, [id]);

  useEffect(() => {
    if (!doc || normalizedStatus !== 'pending') {
      setHasOtherProcessingTask(false);
      return;
    }
    let disposed = false;
    const run = async () => {
      try {
        const processingDocs = await getDocuments({ indexingStatus: 'Processing' });
        if (disposed) return;
        setHasOtherProcessingTask(processingDocs.some((item) => item.id !== id));
      } catch {
        if (!disposed) setHasOtherProcessingTask(false);
      }
    };

    void run();
    const timer = window.setInterval(run, 3000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [doc, id, normalizedStatus]);

  const fileOpenHref = useMemo(() => {
    if (!doc?.filePath) return '';
    return withVersionedAssetUrl(resolveApiAssetUrl(doc.filePath), doc.version);
  }, [doc?.filePath, doc?.version]);

  const interactionLocked = normalizedStatus === 'pending' || normalizedStatus === 'processing';
  const totalPages = liveStatus?.totalPages ?? doc?.totalPages ?? 0;
  const totalChunks = liveStatus?.totalChunks ?? 0;
  const currentProgressIndex = liveStatus?.currentPageIndexing ?? doc?.currentPageIndexing ?? 0;
  const step1Percent =
    totalPages > 0 ? Math.min(100, Math.max(0, Math.round((currentProgressIndex / totalPages) * 100))) : 0;
  const step1Done = totalPages > 0 && (step1Percent >= 100 || totalChunks > 0);
  const step2Active = /vector|embed|huggingface/i.test(liveStatus?.currentOperation ?? '');
  const step2Percent =
    totalChunks > 0 && step2Active
      ? Math.min(100, Math.max(0, Math.round((currentProgressIndex / totalChunks) * 100)))
      : 0;

  const handleReindex = async () => {
    try {
      setIsReindexing(true);
      setReindexMessage(null);
      const response = await reindexAdminDocument(id);
      setReindexMessage({ type: 'success', text: response.message || 'Reindexing started.' });
      
      // Refetch doc to see updated status
      const data = await getAdminDocumentById(id);
      setDoc(data);
      applyIngestionSnapshot({
        source: 'rest',
        status: data.indexingStatus,
        currentPageIndexing: data.currentPageIndexing,
        totalPages: data.totalPages,
        totalChunks: undefined,
        currentOperation: undefined,
      });
    } catch (err: unknown) {
      console.error('Error reindexing document:', err);
      setReindexMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to start reindexing.',
      });
    } finally {
      setIsReindexing(false);
    }
  };

  const centerStatusUi = (() => {
    if (normalizedStatus === 'completed') {
      return {
        title: 'Completed',
        icon: <CheckCircle2 className="h-14 w-14 text-emerald-600" />,
        subtitle: 'Document indexing is complete and ready for use.',
      };
    }
    if (normalizedStatus === 'failed') {
      return {
        title: 'Failed',
        icon: <XCircle className="h-14 w-14 text-red-600" />,
        subtitle: 'The latest indexing run failed. Retry or upload a new version.',
      };
    }
    return {
      title: isReindexingStatus ? 'Reindexing' : 'Processing',
      icon: <RefreshCw className="h-14 w-14 animate-spin text-sky-600" />,
      subtitle: isReindexingStatus
        ? 'Refreshing the document index with the latest file revision.'
        : 'Indexing pipeline is currently running.',
    };
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse text-lg">Loading document details...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-red-50 rounded-3xl border border-red-100 mt-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Document Not Found</h3>
        <p className="text-red-500 mb-8 text-center max-w-md text-lg">
          {error || 'The requested document could not be found or you do not have permission to view it.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_18px_46px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        
        <div className="p-8 sm:p-10 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {doc.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    <Calendar className="w-4 h-4" />
                    {new Date(doc.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    <Layers className="w-4 h-4" />
                    Version {doc.version}
                  </span>
                  {doc.categoryName && (
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <FolderOpen className="w-4 h-4" />
                      Category: {doc.categoryName}
                    </span>
                  )}
                </div>
                {normalizedStatus === 'pending' && hasOtherProcessingTask ? (
                  <div className="mt-3 rounded-xl border border-sky-400/25 bg-sky-50 px-3 py-2">
                    <p className="text-xs font-medium text-sky-800">
                      In Queue: Waiting for other tasks...
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              {doc.isOutdated ? (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium text-xs">
                  Outdated Content
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-gray-50/50">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
                {centerStatusUi.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{centerStatusUi.title}</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">
                  {centerStatusUi.subtitle}
                </p>
              </div>

              {normalizedStatus === 'pending' || normalizedStatus === 'processing' ? (
                <div className="w-full max-w-2xl rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-left">
                  <p className="text-sm font-semibold text-sky-900">Ingestion Pipeline</p>
                  <div className="mt-3 space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                        <span className="text-sky-900">
                          {isReindexingStatus
                            ? 'Step 1: Re-analyzing Document Pages'
                            : 'Step 1: Parsing Document Pages'}
                        </span>
                        <span className={step1Done ? 'text-emerald-700' : 'text-sky-800'}>
                          {step1Done ? 'Completed' : `${step1Percent}%`}
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sky-100">
                        <div
                          className={`h-full ${step1Done ? 'bg-emerald-500' : 'bg-sky-500'}`}
                          style={{ width: `${step1Done ? 100 : step1Percent}%`, transition: 'width 0.3s ease-in-out' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                        <span className="text-sky-900">
                          {isReindexingStatus
                            ? 'Step 2: Re-vectorizing Content'
                            : 'Step 2: Vectorizing Content'}
                        </span>
                        <span className="text-sky-800">{step2Active ? `${step2Percent}%` : 'Waiting'}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sky-100">
                        {step2Active ? (
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${step2Percent}%`, transition: 'width 0.3s ease-in-out' }}
                          />
                        ) : (
                          <div className="h-full w-0 rounded-full bg-cyan-400/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {reindexMessage && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-left w-full max-w-md mx-auto border ${
                  reindexMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-in fade-in slide-in-from-top-2' 
                    : 'bg-red-50 text-red-700 border-red-100 animate-in fade-in slide-in-from-top-2'
                }`}>
                  {reindexMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium leading-relaxed">{reindexMessage.text}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 w-full">
                <Button
                  onClick={handleReindex}
                  disabled={isReindexing || interactionLocked}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isReindexing ? <Loader2 className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
                  Reindex Document
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={interactionLocked}
                  onClick={() => setReplaceOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <FileUp className="w-5 h-5" />
                  Upload New Version
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={interactionLocked || !fileOpenHref}
                  onClick={() => {
                    if (!fileOpenHref) return;
                    window.open(fileOpenHref, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open in New Tab
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={interactionLocked || !fileOpenHref}
                  onClick={() => {
                    if (!fileOpenHref) return;
                    window.open(fileOpenHref, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </Button>
              </div>
            </div>

          </div>
        </div>

      </div>
      <AdminDocumentReplaceFileModal
        open={replaceOpen}
        documentId={doc.id}
        documentTitle={doc.title}
        onClose={() => setReplaceOpen(false)}
        onSuccess={(result) => {
          setReplaceOpen(false);
          const nextStatus = result.indexingStatus ?? 'Reindexing';
          setDoc((prev) =>
            prev
              ? {
                  ...prev,
                  indexingStatus: nextStatus,
                  currentPageIndexing: 0,
                  totalPages: prev.totalPages,
                }
              : prev,
          );
          applyIngestionSnapshot({
            source: 'rest',
            status: nextStatus,
            currentPageIndexing: 0,
            totalPages: liveStatus?.totalPages ?? doc.totalPages,
            totalChunks: liveStatus?.totalChunks,
            currentOperation: 'Re-analyzing Document...',
          });
          void (async () => {
            const [data, status] = await Promise.all([getAdminDocumentById(id), fetchDocumentStatus(id)]);
            setDoc(data);
            applyIngestionSnapshot({
              source: 'rest',
              status: status.status || data.indexingStatus,
              currentPageIndexing: status.currentPageIndexing ?? data.currentPageIndexing,
              totalPages: status.totalPages ?? data.totalPages,
              totalChunks: status.totalChunks,
              currentOperation: status.currentOperation,
            });
          })();
        }}
      />
    </div>
  );
}
