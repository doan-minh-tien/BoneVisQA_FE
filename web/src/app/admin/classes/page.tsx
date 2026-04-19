'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import {
  fetchAdminClasses,
  createAdminClass,
  updateAdminClass,
  deleteAdminClass,
  type AdminClassModel,
} from '@/lib/api/admin-classes';
import { ClassManagementTable } from '@/components/admin/classes/ClassManagementTable';
import { ClassEnrollmentsDialog } from '@/components/admin/classes/ClassEnrollmentsDialog';

export default function AdminClassesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSemester, setNewSemester] = useState('');
  const [enrollmentsTarget, setEnrollmentsTarget] = useState<AdminClassModel | null>(null);
  const [editTarget, setEditTarget] = useState<AdminClassModel | null>(null);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState('');

  // Queries
  const classesQuery = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: fetchAdminClasses,
  });

  const classes = classesQuery.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ className, semester }: { className: string, semester: string }) => {
      return createAdminClass({ className, semester });
    },
    onSuccess: () => {
      toast.success('Class created successfully.');
      setCreateOpen(false);
      setNewClassName('');
      setNewSemester('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to create class: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      className,
      semester,
    }: {
      id: string;
      className: string;
      semester: string;
    }) => {
      return updateAdminClass(id, { className, semester });
    },
    onSuccess: () => {
      toast.success('Class updated successfully.');
      setEditTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to update class: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteAdminClass(id);
    },
    onSuccess: () => {
      toast.success('Class deleted successfully.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete class: ${err.message}`);
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleCreate = () => {
    if (!newClassName.trim() || !newSemester.trim()) {
      toast.error('Please enter both class name and semester.');
      return;
    }
    createMutation.mutate({ className: newClassName.trim(), semester: newSemester.trim() });
  };

  const handleDelete = (cls: AdminClassModel) => {
    if (confirm(`Are you sure you want to delete class ${cls.className}?`)) {
      deleteMutation.mutate(cls.id);
    }
  };

  const openEdit = (cls: AdminClassModel) => {
    setEditTarget(cls);
    setEditName(cls.className);
    setEditSemester(cls.semester);
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    if (!editName.trim() || !editSemester.trim()) {
      toast.error('Please enter both class name and semester.');
      return;
    }
    updateMutation.mutate({
      id: editTarget.id,
      className: editName.trim(),
      semester: editSemester.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title={t('classes.title', 'Class Management')}
        subtitle={`${classes.length} classes loaded from the registry`}
      />

      <div className="mx-auto max-w-[1600px] space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Manage academic classes, assign lecturers, experts, and enroll students.
          </div>
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Create Class
            </button>
          </div>
        </div>

        <ClassManagementTable
          classes={classes}
          onManageEnrollments={(cls) => setEnrollmentsTarget(cls)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!saving) setCreateOpen(false);
            }}
          />
          <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                if (!saving) setCreateOpen(false);
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <BookOpen className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Create class</h3>
                <p className="text-sm text-slate-500">Adds a new class to the system registry.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Class name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Radiology 2026-A"
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Semester <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!saving) setCreateOpen(false);
                }}
                disabled={saving}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-700 disabled:opacity-70"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!saving) setEditTarget(null);
            }}
          />
          <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                if (!saving) setEditTarget(null);
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <BookOpen className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit class</h3>
                <p className="text-xs font-mono text-slate-500 break-all">{editTarget.id}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Class name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Semester <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!saving) setEditTarget(null);
                }}
                disabled={saving}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-700 disabled:opacity-70"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollmentsTarget && (
        <ClassEnrollmentsDialog
          cls={enrollmentsTarget}
          onCancel={() => setEnrollmentsTarget(null)}
        />
      )}
    </div>
  );
}
