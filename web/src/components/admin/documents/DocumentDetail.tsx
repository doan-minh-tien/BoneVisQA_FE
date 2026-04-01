'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminDocumentById,
  reindexAdminDocument,
  type AdminDocumentDetail,
} from '@/lib/api/admin-documents';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  ExternalLink,
  Download,
  DatabaseZap
} from 'lucide-react';

export default function DocumentDetail({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<AdminDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminDocumentById(id);
        setDoc(data);
      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Failed to load document details');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id]);

  const handleReindex = async () => {
    try {
      setIsReindexing(true);
      setReindexMessage(null);
      const response = await reindexAdminDocument(id);
      setReindexMessage({ type: 'success', text: response.message || 'Reindexing started.' });
      
      // Refetch doc to see updated status
      const data = await getAdminDocumentById(id);
      setDoc(data);
    } catch (err: any) {
      console.error('Error reindexing document:', err);
      setReindexMessage({ type: 'error', text: err.message || 'Failed to start reindexing.' });
    } finally {
      setIsReindexing(false);
    }
  };

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
        <button
          onClick={() => router.push('/admin/documents')}
          className="px-8 py-3 flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors font-semibold shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      {/* Navigation */}
      <button
        onClick={() => router.push('/admin/documents')}
        className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium w-fit"
      >
        <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to list
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Header Header */}
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
                  {doc.categoryId && (
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <MapPin className="w-4 h-4" />
                      Category: {doc.categoryId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              {getStatusBadge(doc.indexingStatus)}
              {doc.isOutdated && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium text-xs">
                  Outdated Content
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Panel & Preview */}
        <div className="p-8 sm:p-10 bg-gray-50/50">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Document Actions</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto">
                  Access the original file to review its contents or trigger a manual reindex of the knowledge base.
                </p>
              </div>

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
                <button
                  onClick={handleReindex}
                  disabled={isReindexing || doc.indexingStatus === 'Processing'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
                >
                  {isReindexing ? <Loader2 className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
                  Reindex Document
                </button>

                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary/50 text-primary px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open in New Tab
                </a>
                
                <a
                  href={doc.filePath}
                  download
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
