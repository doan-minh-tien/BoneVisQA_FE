'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { replaceDocumentFile, reindexAdminDocument } from '@/lib/api/admin-documents';
import type { DocumentUploadResponse } from '@/lib/api/types';
import { AlertCircle, AlertTriangle, FileText, X } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

export type AdminDocumentReplaceFileModalProps = {
  open: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onSuccess: (result: DocumentUploadResponse) => void;
  /** Which flow is selected when the modal opens. */
  defaultAction?: 'replace' | 'reindex';
};

export default function AdminDocumentReplaceFileModal({
  open,
  documentId,
  documentTitle,
  onClose,
  onSuccess,
  defaultAction = 'replace',
}: AdminDocumentReplaceFileModalProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [actionMode, setActionMode] = useState<'replace' | 'reindex'>('replace');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActionMode(defaultAction);
  }, [open, defaultAction]);

  const normalizeName = (value: string) =>
    value
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[_\-.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const isNameDrasticallyDifferent = (currentName: string, selectedName: string) => {
    const currentTokens = new Set(normalizeName(currentName).split(' ').filter(Boolean));
    const selectedTokens = new Set(normalizeName(selectedName).split(' ').filter(Boolean));
    if (currentTokens.size === 0 || selectedTokens.size === 0) return true;
    let overlap = 0;
    for (const t of selectedTokens) {
      if (currentTokens.has(t)) overlap += 1;
    }
    const overlapRatio = overlap / Math.max(currentTokens.size, selectedTokens.size);
    return overlapRatio < 0.35;
  };

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setError(null);
    setIsConfirmed(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, onClose, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actionMode === 'reindex') {
      setSubmitting(true);
      try {
        const res = await reindexAdminDocument(documentId);
        toast.success(res.message || 'Re-indexing started.');
        reset();
        onSuccess({
          documentId,
          indexingStatus: res.indexingStatus ?? 'Reindexing',
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start re-indexing.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!file) {
      setError('Please select a new PDF file.');
      return;
    }
    if (!isConfirmed) {
      setError('Please confirm this is an updated version before uploading.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      const result = await replaceDocumentFile(
        documentId,
        file,
        (pct) => setProgress(Math.min(100, Math.max(0, pct))),
      );
      toast.success('File replaced successfully. Reindexing restarted from the beginning.');
      reset();
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace file.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  const nameMismatch = file ? isNameDrasticallyDifferent(documentTitle, file.name) : false;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
        aria-label="Close"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_44px_rgba(15,23,42,0.2)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Document file &amp; indexing</h2>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{documentTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <fieldset className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="doc-action"
                className="mt-1"
                checked={actionMode === 'reindex'}
                disabled={submitting}
                onChange={() => {
                  setActionMode('reindex');
                  setError(null);
                }}
              />
              <span>
                <span className="font-medium text-card-foreground">Re-index current file</span>
                <span className="block text-xs text-muted-foreground">
                  Reprocess the existing PDF already stored for this document (no new upload).
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="doc-action"
                className="mt-1"
                checked={actionMode === 'replace'}
                disabled={submitting}
                onChange={() => {
                  setActionMode('replace');
                  setError(null);
                }}
              />
              <span>
                <span className="font-medium text-card-foreground">Upload a new PDF</span>
                <span className="block text-xs text-muted-foreground">
                  Replace the stored file and restart indexing from the new upload.
                </span>
              </span>
            </label>
          </fieldset>

          {actionMode === 'replace' ? (
            <div
              className="flex gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-950"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p>
                Warning: Overwriting this document will replace its knowledge base for the AI. Please ensure the new
                file is an actual revision of the existing content.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {actionMode === 'replace' ? (
            <>
              <div>
                <label htmlFor="replace-file" className="text-sm font-medium text-card-foreground">
                  New PDF File <span className="text-destructive">*</span>
                </label>
                <input
                  id="replace-file"
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={submitting}
                  className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) {
                      setFile(null);
                      return;
                    }
                    if (f.size > MAX_BYTES) {
                      setFile(null);
                      setError('Maximum file size is 50MB.');
                      return;
                    }
                    setFile(f);
                    setError(null);
                  }}
                />
                {file ? (
                  <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Comparison View
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="w-32 shrink-0 text-muted-foreground">Current Document:</span>
                        <span className="font-medium text-card-foreground">{documentTitle}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-32 shrink-0 text-muted-foreground">New Upload:</span>
                        <span
                          className={`font-bold ${nameMismatch ? 'text-red-600' : 'text-card-foreground'}`}
                        >
                          {file.name}
                        </span>
                      </div>
                      {nameMismatch ? (
                        <p className="text-xs text-red-600">
                          File name looks very different from the current document. Please verify before uploading.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border"
                  checked={isConfirmed}
                  disabled={submitting || !file}
                  onChange={(e) => {
                    setIsConfirmed(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                />
                <span className="text-card-foreground">
                  I confirm that this file is the updated version of the current document.
                </span>
              </label>

              {submitting ? (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                This runs the indexing pipeline on the PDF already linked to this document. Use this after fixing
                server-side issues or when embeddings need to be rebuilt without changing the file.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={
                submitting ||
                (actionMode === 'replace' && (!file || !isConfirmed)) ||
                (actionMode === 'reindex' && !documentId)
              }
              className="rounded-xl shadow-sm"
            >
              {actionMode === 'reindex' ? 'Start Re-indexing' : 'Start Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
