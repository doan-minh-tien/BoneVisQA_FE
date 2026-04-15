'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { replaceDocumentFile } from '@/lib/api/admin-documents';
import { AlertCircle, AlertTriangle, FileText, X } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

export type AdminDocumentReplaceFileModalProps = {
  open: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminDocumentReplaceFileModal({
  open,
  documentId,
  documentTitle,
  onClose,
  onSuccess,
}: AdminDocumentReplaceFileModalProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setError(null);
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
    if (!file) {
      setError('Chọn tệp PDF mới.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      await replaceDocumentFile(documentId, file, (pct) => setProgress(Math.min(100, Math.max(0, pct))));
      toast.success('Đã lên file mới — lập chỉ mục sẽ chạy lại từ đầu.');
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật tệp thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-background/70 backdrop-blur-sm" aria-label="Đóng" onClick={handleClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Cập nhật tệp</h2>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{documentTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div
            className="flex gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-950 dark:text-amber-100"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-200" />
            <p>
              Tải lên file mới sẽ xóa toàn bộ dữ liệu chỉ mục cũ và bắt đầu quá trình băm nhỏ lại.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="replace-file" className="text-sm font-medium text-card-foreground">
              File PDF mới <span className="text-destructive">*</span>
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
                  setError('Tệp tối đa 50MB.');
                  return;
                }
                setFile(f);
                setError(null);
              }}
            />
            {file ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </p>
            ) : null}
          </div>

          {submitting ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Đang tải lên</span>
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

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting || !file}>
              Xác nhận thay thế
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
