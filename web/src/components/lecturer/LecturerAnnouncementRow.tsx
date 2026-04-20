'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Link,
  Loader2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { deleteAnnouncement, getClassAssignments, getLecturerClasses, moveAnnouncement, updateAnnouncement } from '@/lib/api/lecturer';
import type { Announcement } from '@/lib/api/types';
import type { ClassAssignment, ClassItem } from '@/lib/api/types';

type Props = {
  announcement: Announcement;
  /** Hiện tên lớp (trang xem tất cả lớp) */
  showClassName?: boolean;
  /** Lecturer ID (required for class list when editing) */
  lecturerId?: string;
  onUpdated: (updated: Announcement) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
};

export function LecturerAnnouncementRow({
  announcement: a,
  showClassName,
  lecturerId,
  onUpdated,
  onDeleted,
  onError,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [content, setContent] = useState(a.content);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    a.relatedAssignment?.assignmentId ?? null
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(a.classId);
  const [sendEmailOnSave, setSendEmailOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Reset form when announcement changes or when entering edit mode
  useEffect(() => {
    setTitle(a.title);
    setContent(a.content);
    setSelectedAssignmentId(a.relatedAssignment?.assignmentId ?? null);
    setSelectedClassId(a.classId);
    setSendEmailOnSave(false);
    setConfirmDelete(false);
  }, [a.id, a.title, a.content, a.relatedAssignment?.assignmentId, a.classId]);

  // Fetch assignments and classes when entering edit mode
  useEffect(() => {
    if (editing) {
      fetchAssignments();
      fetchClasses();
    }
  }, [editing, selectedClassId]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const list = await getClassAssignments(selectedClassId);
      setAssignments(list);
    } catch {
      onError('Failed to load assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchClasses = async () => {
    if (!lecturerId) return;
    setLoadingClasses(true);
    try {
      const list = await getLecturerClasses(lecturerId);
      setClasses(list);
    } catch {
      onError('Failed to load classes.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      onError('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      // If class changed, move the announcement first
      if (selectedClassId !== a.classId) {
        await moveAnnouncement(a.id, selectedClassId);
      }

      const updated = await updateAnnouncement(a.classId, a.id, {
        title: title.trim(),
        content: content.trim(),
        sendEmail: sendEmailOnSave,
        assignmentId: selectedAssignmentId || null,
      });
      
      // If moved to new class, update the local state with new class info
      if (selectedClassId !== a.classId) {
        const newClass = classes.find(c => c.id === selectedClassId);
        const movedAnnouncement: Announcement = {
          ...updated,
          classId: selectedClassId,
          className: newClass?.className ?? updated.className,
          relatedAssignment: null, // Assignment cleared when moving
        };
        onUpdated(movedAnnouncement);
      } else {
        onUpdated(updated);
      }
      
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

  // Reset assignment when class changes
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setSelectedAssignmentId(null); // Reset assignment when changing class
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
                {/* Related Assignment Badge */}
                {a.relatedAssignment?.assignmentTitle && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Link className="w-3 h-3" />
                    {a.relatedAssignment.assignmentType?.toUpperCase()}: {a.relatedAssignment.assignmentTitle}
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
                    setSelectedAssignmentId(a.relatedAssignment?.assignmentId ?? null);
                    setSelectedClassId(a.classId);
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
              Delete this announcement?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Students will no longer see this content on the platform.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={runDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editing && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {/* Class Selector */}
            {lecturerId && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-card-foreground">Class</label>
                {loadingClasses ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading classes...
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                )}
                {selectedClassId !== a.classId && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Moving to a different class will clear the linked assignment.
                  </p>
                )}
              </div>
            )}

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

            {/* Assignment Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-card-foreground">
                Linked Assignment (optional)
              </label>
              <p className="mt-0 mb-2 text-[11px] text-muted-foreground">
                Link this announcement to a case or quiz. Select none to remove the link.
              </p>
              {loadingAssignments ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments available for this class.</p>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedAssignmentId ?? ''}
                    onChange={(e) => setSelectedAssignmentId(e.target.value || null)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm cursor-pointer"
                  >
                    <option value="">-- No assignment --</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        [{assignment.type.toUpperCase()}] {assignment.title}
                        {assignment.dueDate
                          ? ` (Due: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')})`
                          : ''}
                      </option>
                    ))}
                  </select>

                  {/* Show selected assignment info */}
                  {selectedAssignmentId && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {assignments.find((a) => a.id === selectedAssignmentId)?.type}
                        </span>
                        <span className="text-sm">
                          {assignments.find((a) => a.id === selectedAssignmentId)?.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAssignmentId(null)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        title="Remove assignment link"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                  setSelectedAssignmentId(a.relatedAssignment?.assignmentId ?? null);
                  setSelectedClassId(a.classId);
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
