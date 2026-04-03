'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminDocuments, type DocumentDto } from '@/lib/api/admin-documents';
import UploadDocumentDialog from './UploadDocumentDialog';
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
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-sm"
              placeholder="Search documents by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-[0_4px_14px_0_rgba(20,184,166,0.25)]"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load</h3>
            <p className="text-red-500 mb-6 text-center max-w-md">{error}</p>
            <button
              onClick={fetchDocuments}
              className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors font-medium shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white w-full rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-500 max-w-md text-center">
              {searchTerm ? "No documents match your search criteria." : "Get started by uploading your first document to the knowledge base."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600">Document</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Indexing Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Version</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Created</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5 border border-primary/10">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <Link href={`/admin/documents/${doc.id}`} className="font-semibold text-gray-900 tracking-wide text-[15px] mb-1 hover:text-primary transition-colors block">
                              {doc.title}
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {doc.categoryId && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
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
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-gray-100/80 text-gray-600 text-xs font-semibold border border-gray-200">
                          v{doc.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-sm text-gray-500 font-medium">
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
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all"
                            title="View Details"
                          >
                            <span className="text-xs font-semibold px-1">Details</span>
                          </Link>
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100 shadow-sm transition-all"
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
