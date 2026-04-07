'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Plus, Search, ShieldAlert, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ClassItem } from '@/lib/api/types';
import {
  ForbiddenApiError,
  createLecturerClass,
  fetchLecturerClasses,
} from '@/lib/api/lecturer-classes';

export default function LecturerClassesPage() {
  const toast = useToast();
  const [items, setItems] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [semester, setSemester] = useState('');
  const [expertId, setExpertId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await fetchLecturerClasses();
        if (!ignore) setItems(data);
      } catch (err) {
        if (ignore) return;
        if (err instanceof ForbiddenApiError) {
          setIsForbidden(true);
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load classes.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const semesters = useMemo(() => Array.from(new Set(items.map((item) => item.semester))).sort(), [items]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchSearch = item.className.toLowerCase().includes(search.toLowerCase());
        const matchSemester = semesterFilter === 'all' || item.semester === semesterFilter;
        return matchSearch && matchSemester;
      }),
    [items, search, semesterFilter],
  );

  const onCreateClass = async () => {
    if (!className.trim() || !semester.trim()) {
      toast.error('Class name and semester are required.');
      return;
    }
    setIsCreating(true);
    try {
      const created = await createLecturerClass({
        className: className.trim(),
        semester: semester.trim(),
        expertId: expertId.trim() || undefined,
      });
      setItems((prev) => [created, ...prev]);
      setCreateOpen(false);
      setClassName('');
      setSemester('');
      setExpertId('');
      toast.success('Class created successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create class.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Class Management" subtitle="Manage classes, enrollment, and class-level assignments." />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total classes</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">{items.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Semesters</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">{semesters.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Visible results</p>
            <p className="mt-2 text-2xl font-semibold text-card-foreground">{filtered.length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search classes..."
                className="pl-9"
              />
            </div>
            <select
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="all">All semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading classes...
          </div>
        ) : isForbidden ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="You do not have permission to view classes"
            description={error || 'Please contact your administrator for class management access.'}
          />
        ) : error ? (
          <EmptyState title="Unable to load classes" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No classes found"
            description="Create your first class or adjust your filters."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/lecturer/classes/${item.id}`}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {item.semester}
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{item.className}</h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Created{' '}
                    {new Date(item.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Open class workbench</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={createOpen}
        onClose={() => !isCreating && setCreateOpen(false)}
        title="Create New Class"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={onCreateClass} isLoading={isCreating}>
              Create Class
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Class Name</label>
            <Input value={className} onChange={(event) => setClassName(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Semester</label>
            <Input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="2026-Spring" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Expert ID (optional)</label>
            <Input value={expertId} onChange={(event) => setExpertId(event.target.value)} placeholder="GUID from expert account" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
