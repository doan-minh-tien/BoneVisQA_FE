'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { fetchStudentClasses } from '@/lib/api/student';
import type { StudentClassItem } from '@/lib/api/student';
import { BookOpen, GraduationCap, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function StudentClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentClasses();
        if (!cancelled) setClasses(data);
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
      <Header title="My Class" subtitle="View your enrolled class, lecturer, semester, and coursework at a glance." />

      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 md:px-10">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading your classes…
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">No enrolled classes</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              You are not enrolled in any classes yet. Contact your department administrator or lecturer to get enrolled.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 shadow-sm">
              <div className="px-6 py-6 sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Class Overview</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{classes[0].className}</h2>
                <p className="mt-1 text-sm text-slate-600">Professional bone imaging coursework dashboard</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class Name</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{classes[0].className}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecturer Name</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UserRound className="h-4 w-4 text-primary" />
                  {classes[0].lecturerName?.trim() || 'Instructor'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semester</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{classes[0].semester || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coursework</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {classes[0].totalCases} Cases · {classes[0].totalQuizzes} Quizzes
                </p>
              </div>
            </div>
            <div>
              <Button type="button" onClick={() => router.push(`/student/classes/${classes[0].classId}`)}>
                Open My Class
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
