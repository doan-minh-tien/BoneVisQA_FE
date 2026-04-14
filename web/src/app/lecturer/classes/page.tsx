'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Search, ShieldAlert, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ClassItem } from '@/lib/api/types';
import { ForbiddenApiError, fetchLecturerClasses } from '@/lib/api/lecturer-classes';

export default function LecturerClassesPage() {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Your classes"
        subtitle="View assigned classes and open the workbench to assign cases, quizzes, and announcements."
      />

      <section className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-sm text-muted-foreground">Total classes</p>
            <p className="mt-2 font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-card-foreground">
              {items.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-sm text-muted-foreground">Semesters</p>
            <p className="mt-2 font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-card-foreground">
              {semesters.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-sm text-muted-foreground">Visible results</p>
            <p className="mt-2 font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-card-foreground">
              {filtered.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search classes..."
                  className="rounded-xl pl-9"
                />
              </div>
              <select
                value={semesterFilter}
                onChange={(event) => setSemesterFilter(event.target.value)}
                className="h-10 rounded-xl border border-border bg-input px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-sm text-muted-foreground animate-pulse">
            Loading classes…
          </div>
        ) : isForbidden ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="You do not have permission to view classes"
            description={error || 'Please contact your administrator for access.'}
          />
        ) : error ? (
          <EmptyState title="Unable to load classes" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-7 w-7 opacity-90" />}
            title="No classes match your filters"
            description={
              items.length === 0
                ? 'Classes are created and rostered by an administrator. When you are assigned to a class, it will appear here.'
                : 'Try a different search or semester filter.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/lecturer/classes/${item.id}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"
              >
                <div className="mb-3 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {item.semester}
                </div>
                <h3 className="font-['Manrope',sans-serif] text-lg font-bold tracking-tight text-card-foreground transition-colors group-hover:text-primary">
                  {item.className}
                </h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span>
                    Created{' '}
                    {new Date(item.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary/90">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>Open workbench →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
