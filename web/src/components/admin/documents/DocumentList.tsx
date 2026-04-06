'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminDocuments, type DocumentDto } from '@/lib/api/admin-documents';
import UploadDocumentDialog from './UploadDocumentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function DocumentList() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Processing
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96 group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
            </div>
            <Input
              type="text"
              className="pl-10"
              placeholder="Search documents by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            type="button"
            onClick={() => setIsUploadOpen(true)}
          >
            <Plus className="w-5 h-5" />
            <span>Upload Document</span>
          </Button>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="animate-pulse font-medium text-slate-500">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Failed to load</h3>
            <p className="text-red-500 mb-6 text-center max-w-md">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={fetchDocuments}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">No Documents Found</h3>
            <p className="max-w-md text-center text-slate-500">
              {searchTerm ? "No documents match your search criteria." : "Get started by uploading your first document to the knowledge base."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Document</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Indexing Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Version</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="group transition-colors even:bg-slate-50/40 hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5 border border-primary/10">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <Link href={`/admin/documents/${doc.id}`} className="mb-1 block text-[15px] font-semibold tracking-wide text-slate-900 transition-colors hover:text-primary">
                              {doc.title}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {doc.categoryId && (
                                <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {doc.categoryId}
                                </span>
                              )}
                              {doc.isOutdated && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                                  Outdated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {getStatusBadge(doc.indexingStatus)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="inline-flex items-center justify-center rounded border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          v{doc.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm font-medium text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/documents/${doc.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-primary shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-white"
                            title="View Details"
                          >
                            <span className="text-xs font-semibold px-1">Details</span>
                          </Link>
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-100"
                            title="Open PDF"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <UploadDocumentDialog 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false);
          fetchDocuments();
        }}
      />
    </>
  );
}
