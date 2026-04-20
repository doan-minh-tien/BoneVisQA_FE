'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { StudentClassesList } from '@/components/student/StudentClassWorkbench';
import { toast } from 'sonner';
import { Loader2, GraduationCap } from 'lucide-react';
import { fetchStudentClasses, type StudentClassItem } from '@/lib/api/student';

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentClasses();
        if (cancelled) return;
        setClasses(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load your classes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="My Classes"
        subtitle="View your enrolled classes and access coursework, quizzes, and announcements."
      />

      <section className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 pb-16 sm:px-6">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-sm text-muted-foreground animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your classes…
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">
              No enrolled classes
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              You are not enrolled in any classes yet. Contact your department administrator or lecturer to get enrolled.
            </p>
          </div>
        ) : (
          <StudentClassesList
            classes={classes}
            search={search}
            semesterFilter={semesterFilter}
            onSearchChange={setSearch}
            onSemesterChange={setSemesterFilter}
          />
        )}
      </section>
    </div>
  );
}
