'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { uploadDocument } from '@/lib/api/admin-documents';
import type { CategoryOption, TagOption } from '@/lib/api/types';
import { AlertCircle, FileText, Loader2, Upload, X } from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024;

function defaultTitleFromFile(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, '');
  return (base || file.name).trim();
}

export type AdminDocumentsUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
  tags: TagOption[];
  loadingMeta: boolean;
};

export default function AdminDocumentsUploadModal({
  open,
  onClose,
  onSuccess,
  categories,
  tags,
  loadingMeta,
}: AdminDocumentsUploadModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setTitle('');
    setCategoryId('');
    setTagIds([]);
    setUploadProgress(0);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, onClose, reset]);

  const toggleTag = useCallback((id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!file) {
      setFormError('Chọn một tệp PDF để tải lên.');
      return;
    }
    if (!title.trim()) {
      setFormError('Nhập tiêu đề tài liệu.');
      return;
    }
    if (!categoryId.trim()) {
      setFormError('Chọn danh mục.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      await uploadDocument({
        file,
        title: title.trim(),
        categoryId: categoryId.trim(),
        tagIds,
        onUploadProgress: (pct) => setUploadProgress(Math.min(100, Math.max(0, pct))),
      });
      toast.success('Tải lên thành công. Tài liệu đang chờ lập chỉ mục.');
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Tải lên thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-label="Đóng"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Tải lên tài liệu</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">PDF — tối đa 50MB</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {formError ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </div>
          ) : null}

          <div>
            <label htmlFor="adm-doc-title" className="text-sm font-medium text-card-foreground">
              Tiêu đề <span className="text-destructive">*</span>
            </label>
            <input
              id="adm-doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="Ví dụ: Hướng dẫn chẩn đoán hình ảnh"
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="adm-doc-file" className="text-sm font-medium text-card-foreground">
              Tệp <span className="text-destructive">*</span>
            </label>
            <input
              id="adm-doc-file"
              ref={fileInputRef}
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
                  setFormError('Tệp vượt quá 50MB.');
                  return;
                }
                setFile(f);
                setFormError(null);
                if (!title.trim()) setTitle(defaultTitleFromFile(f));
              }}
            />
            {file ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="adm-doc-category" className="text-sm font-medium text-card-foreground">
              Danh mục <span className="text-destructive">*</span>
            </label>
            <select
              id="adm-doc-category"
              value={categoryId}
              disabled={loadingMeta || submitting}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{loadingMeta ? 'Đang tải…' : 'Chọn danh mục'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-card-foreground">Thẻ (tùy chọn)</p>
            <p className="text-xs text-muted-foreground">Chọn một hoặc nhiều thẻ để hỗ trợ truy vấn RAG.</p>
            {loadingMeta ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Đang tải thẻ…
              </div>
            ) : tags.length > 0 ? (
              <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                {tags.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={tagIds.includes(t.id)}
                      disabled={submitting}
                      onChange={() => toggleTag(t.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có thẻ từ máy chủ.</p>
            )}
          </div>

          {submitting ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tiến trình tải lên</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              <Upload className="h-4 w-4" />
              Tải lên
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
