'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { deleteAnnouncement, updateAnnouncement } from '@/lib/api/lecturer';
import type { Announcement } from '@/lib/api/types';

type Props = {
  announcement: Announcement;
  /** Hiện tên lớp (trang xem tất cả lớp) */
  showClassName?: boolean;
  onUpdated: (updated: Announcement) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
};

export function LecturerAnnouncementRow({
  announcement: a,
  showClassName,
  onUpdated,
  onDeleted,
  onError,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [content, setContent] = useState(a.content);
  const [sendEmailOnSave, setSendEmailOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(a.title);
    setContent(a.content);
    setEditing(false);
    setSendEmailOnSave(false);
    setConfirmDelete(false);
  }, [a.id, a.title, a.content]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      onError('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAnnouncement(a.classId, a.id, {
        title: title.trim(),
        content: content.trim(),
        sendEmail: sendEmailOnSave,
      });
      onUpdated(updated);
      setEditing(false);
      setSendEmailOnSave(false);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to update announcement.');
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      await deleteAnnouncement(a.classId, a.id);
      onDeleted(a.id);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to delete announcement.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground">{a.title}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(a.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {showClassName && a.className && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {a.className}
                  </span>
                )}
              </div>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditing((prev) => {
                  if (prev) {
                    setTitle(a.title);
                    setContent(a.content);
                    setSendEmailOnSave(false);
                  }
                  return !prev;
                });
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {confirmDelete && (
          <div
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            role="dialog"
            aria-labelledby="announcement-delete-title"
          >
            <p id="announcement-delete-title" className="text-sm font-medium text-card-foreground">
              Xóa thông báo này?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sinh viên sẽ không còn thấy nội dung này trên hệ thống.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={runDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Đang xóa…' : 'Xóa'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {editing && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-card-foreground">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-card-foreground">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-card-foreground">Email students again</p>
                <p className="text-[11px] text-muted-foreground">Send updated content by email</p>
              </div>
              <button
                type="button"
                onClick={() => setSendEmailOnSave(!sendEmailOnSave)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  sendEmailOnSave ? 'bg-success' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    sendEmailOnSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(a.title);
                  setContent(a.content);
                  setSendEmailOnSave(false);
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {expanded && !editing && (
          <div className="mt-3 ml-6">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
