'use client';

import { BookOpen, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  assignUserToClass,
  fetchAvailableClasses,
  fetchUserClasses,
  removeUserFromClass,
  type AvailableClass,
  type UserClassInfo,
} from '@/lib/api/admin-users';
import type { UiUser } from '../UserManagementTable';

interface ManageClassesDialogProps {
  user: UiUser;
  onCancel: () => void;
  onUpdated: (userId: string, updatedClasses: UserClassInfo[]) => void;
}

export function ManageClassesDialog({ user, onCancel, onUpdated }: ManageClassesDialogProps) {
  const [userClasses, setUserClasses] = useState<UserClassInfo[]>([]);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [cls, ava] = await Promise.all([
          fetchUserClasses(user.id),
          fetchAvailableClasses(),
        ]);
        setUserClasses(cls);
        setAvailableClasses(ava);
      } catch {
        // silently fail – parent handles toast
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const assignedClassIds = new Set(userClasses.map((c) => c.id));
  const unassigned = availableClasses.filter(
    (c) =>
      !assignedClassIds.has(c.id) &&
      c.className.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAssign = async (classId: string) => {
    setSubmittingId(classId);
    try {
      const added = await assignUserToClass(user.id, classId);
      const updated = [...userClasses, added];
      setUserClasses(updated);
      onUpdated(user.id, updated);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRemove = async (classId: string) => {
    setSubmittingId(classId);
    try {
      await removeUserFromClass(user.id, classId);
      const updated = userClasses.filter((c) => c.id !== classId);
      setUserClasses(updated);
      onUpdated(user.id, updated);
    } finally {
      setSubmittingId(null);
    }
  };

  const isLecturer = user.role === 'Lecturer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Manage Classes</h3>
              <p className="text-sm text-slate-500">{user.name} &mdash; {isLecturer ? 'Lecturer' : 'Student'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Currently assigned classes */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assigned Classes ({userClasses.length})
              </p>
              {userClasses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                  No classes assigned yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {cls.className}
                      {cls.relationType === 'Lecturer' && (
                        <span className="text-[10px] text-blue-400">(GV)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemove(cls.id)}
                        disabled={submittingId === cls.id}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-100 hover:text-red-500 disabled:opacity-40"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available classes to assign */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available Classes
              </p>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search classes..."
                  className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 p-2">
                {unassigned.length === 0 ? (
                  <p className="py-3 text-center text-sm text-slate-400">No classes found.</p>
                ) : (
                  unassigned.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{cls.className}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {isLecturer ? (
                            <span>Currently: {cls.lecturerName ?? 'No lecturer'}</span>
                          ) : (
                            <span>{cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAssign(cls.id)}
                        disabled={submittingId === cls.id}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submittingId === cls.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-900"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
