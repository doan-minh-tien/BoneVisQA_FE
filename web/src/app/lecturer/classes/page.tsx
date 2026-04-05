'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CreateClassDialog from '@/components/lecturer/classes/CreateClassDialog';
import {
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Search,
  Calendar,
  Loader2,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import { getLecturerClasses, createClass, deleteClass } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClassItem } from '@/lib/api/types';

export default function LecturerClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Create class dialog
  const [showCreate, setShowCreate] = useState(false);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Single delete
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const router = useRouter();

  const handleCreateClass = async (created: ClassItem) => {
    setClasses((prev) => [created, ...prev]);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } catch (e) {
      alert(getApiErrorMessage(e) || 'Xóa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteBulk = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteClass(id)));
      setClasses((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch (e) {
      alert(getApiErrorMessage(e) || 'Xóa thất bại.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClasses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClasses.map((c) => c.id)));
    }
  };

  useEffect(() => {
    async function fetchClasses() {
      try {
        const userId = getStoredUserId();
        if (!userId) {
          setError('Chưa đăng nhập hoặc thiếu userId. Vui lòng đăng nhập lại.');
          return;
        }
        const data = await getLecturerClasses(userId);
        setClasses(data);
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const semesters = Array.from(new Set(classes.map((c) => c.semester))).sort();

  const filteredClasses = classes.filter((c) => {
    const matchSearch = c.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSemester = semesterFilter === 'all' || c.semester === semesterFilter;
    return matchSearch && matchSemester;
  });

  const isAllSelected = filteredClasses.length > 0 && selectedIds.size === filteredClasses.length;
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="min-h-screen">
      <Header title="My Classes" subtitle="Manage and monitor all your classes" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{semesters.length}</p>
              <p className="text-sm text-muted-foreground">Semesters</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{filteredClasses.length}</p>
              <p className="text-sm text-muted-foreground">Showing</p>
            </div>
          </div>
        </div>

        {/* Toolbar: semester filters + search + create */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
          {/* Semester filter pills — horizontal scroll on mobile, wraps on small screens */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap lg:flex-nowrap flex-1">
            <button
              onClick={() => setSemesterFilter('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                semesterFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  semesterFilter === sem
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* Search + Create */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">Create Class</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filteredClasses.length > 0 ? (
          <>
            {/* Bulk action bar */}
            {hasSelection && (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {isAllSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors duration-150 cursor-pointer text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete selected ({selectedIds.size})
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => {
                const isSelected = selectedIds.has(cls.id);
                return (
                  <div
                    key={cls.id}
                    className={`bg-card rounded-xl border-2 p-5 transition-all duration-200 group ${
                      isSelected
                        ? 'border-primary shadow-md ring-2 ring-primary/20'
                        : 'border-border hover:shadow-lg hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleSelect(cls.id); }}
                        className="flex-shrink-0 mt-1 cursor-pointer transition-colors"
                        title={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 group-hover:border-primary transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                            {cls.semester}
                          </span>
                        </div>
                        <Link href={`/lecturer/classes/${cls.id}`} className="block">
                          <h3 className="font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors truncate">
                            {cls.className}
                          </h3>
                        </Link>
                      </div>

                      {/* Edit/Delete */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { e.preventDefault(); router.push(`/lecturer/classes/${cls.id}?edit=1`); }}
                          className="p-1.5 rounded-lg hover:bg-input transition-colors cursor-pointer"
                          title="Edit class"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(cls); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete class"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {new Date(cls.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">No classes found</h3>
            <p className="text-sm text-muted-foreground">
              {classes.length === 0
                ? 'You have no classes yet. Create one to get started.'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      {showCreate && (
        <CreateClassDialog
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateClass}
        />
      )}

      {/* Single Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Delete Class?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete <strong>{deleteTarget.className}</strong>? All enrollments will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSingle}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Dialog */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBulkDelete(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Delete {selectedIds.size} Classes?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You are about to delete <strong>{selectedIds.size} classes</strong>. All enrollments will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBulk}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} classes`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
