'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { fetchDocumentStatus, uploadAdminDocument } from '@/lib/api/admin-documents';
import { X, UploadCloud, File, Loader2, AlertCircle } from 'lucide-react';

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentDialog({
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [indexingDocumentId, setIndexingDocumentId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const statusKey = indexingDocumentId ? `doc-status:${indexingDocumentId}` : null;
  const { data: indexingStatus } = useSWR(
    statusKey,
    () => fetchDocumentStatus(indexingDocumentId as string),
    {
      refreshInterval: (latest) => {
        if (!latest) return 2000;
        const done = latest.progressPercentage >= 100 || latest.status.toLowerCase() === 'completed';
        return done ? 0 : 2000;
      },
      revalidateOnFocus: false,
    },
  );

  const indexingProgress = Math.round(indexingStatus?.progressPercentage ?? 0);
  const totalProgress = useMemo(() => {
    if (!indexingDocumentId) return uploadProgress;
    return uploadProgress >= 100 ? indexingProgress : Math.min(99, uploadProgress);
  }, [indexingDocumentId, indexingProgress, uploadProgress]);

  const isDone = Boolean(indexingDocumentId) && indexingProgress >= 100;
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (isUploading || (!isDone && indexingDocumentId)) return;
    setFile(null);
    setTitle('');
    setUploadProgress(0);
    setIndexingDocumentId(null);
    setTitleError(null);
    setFileError(null);
    setSubmitError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nextFile = e.target.files[0];
      if (nextFile.size > MAX_DOCUMENT_SIZE_BYTES) {
        setFile(null);
        setFileError('Document must be smaller than 10MB.');
        return;
      }
      setFile(nextFile);
      // If title is empty, default it to the filename without extension
      if (!title) {
        const name = nextFile.name;
        setTitle(name.substring(0, name.lastIndexOf('.')) || name);
      }
      setFileError(null);
      setSubmitError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const nextFile = e.dataTransfer.files[0];
      if (nextFile.size > MAX_DOCUMENT_SIZE_BYTES) {
        setFile(null);
        setFileError('Document must be smaller than 10MB.');
        return;
      }
      setFile(nextFile);
      if (!title) {
        const name = nextFile.name;
        setTitle(name.substring(0, name.lastIndexOf('.')) || name);
      }
      setFileError(null);
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError(null);
    setFileError(null);
    setSubmitError(null);

    if (!file) {
      setFileError('Please select a file to upload.');
    }
    if (!title.trim()) {
      setTitleError('Document title is required.');
    }
    if (!file || !title.trim()) {
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setFileError('Document must be smaller than 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const result = await uploadAdminDocument({
        file,
        title: title.trim(),
        categoryId: '',
        tagIds: [],
        onUploadProgress: (pct) => setUploadProgress(Math.min(100, Math.max(0, pct))),
      });
      setUploadProgress(100);
      if (result.documentId) {
        setIndexingDocumentId(result.documentId);
      } else {
        onSuccess();
        handleDismiss();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload document.';
      if (message.includes('This document already exists in the system.')) {
        setFileError('This document already exists in the system.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!isDone) return;
    onSuccess();
    handleDismiss();
  }, [isDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={handleDismiss} 
      />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Upload Document</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add a new file to the knowledge base.</p>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isUploading || (!isDone && indexingDocumentId !== null)}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {submitError && (
            <div className="animate-in slide-in-from-top-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{submitError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="doc-title" className="mb-2 block text-sm font-semibold text-card-foreground">
                Document title <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="e.g. Pediatric fracture guidelines"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {titleError ? <p className="mt-2 text-xs text-destructive">{titleError}</p> : null}
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-card-foreground">
                Document file <span className="text-red-500">*</span>
              </label>
              
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
                  relative group flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer
                  ${file ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}
                  ${isUploading ? 'opacity-60 pointer-events-none' : ''}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={isUploading}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="line-clamp-1 break-all px-4 text-sm font-semibold text-card-foreground transition-colors group-hover:text-primary">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm text-muted-foreground transition-colors group-hover:text-primary">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-card-foreground">
                        <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
              {fileError ? <p className="mt-2 text-xs text-destructive">{fileError}</p> : null}
            </div>
          </div>

          {(isUploading || indexingDocumentId) && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{indexingDocumentId ? 'Indexing progress' : 'Upload progress'}</span>
                <span>{totalProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalProgress}%` }} />
              </div>
              {indexingDocumentId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {indexingStatus?.currentOperation || 'Processing document for retrieval...'}
                </p>
              ) : null}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isUploading || (!isDone && indexingDocumentId !== null)}
              className="rounded-xl border border-border bg-background px-6 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || indexingDocumentId !== null || !file || !title.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
