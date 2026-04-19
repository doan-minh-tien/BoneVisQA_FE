'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { ClassDetailCover } from '@/components/student/ClassDetailVisuals';
import {
  fetchStudentClassDetail,
  fetchStudentClasses,
  type StudentClassDetail,
  type StudentClassItem,
} from '@/lib/api/student';
import { toast } from 'sonner';
import {
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function StudentClassesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'classmates' | 'announcements' | 'coursework'>(
    'overview',
  );
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [detail, setDetail] = useState<StudentClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentClasses();
        if (cancelled) return;
        setClasses(data);
        if (data.length === 1) {
          try {
            const d = await fetchStudentClassDetail(data[0].classId);
            if (!cancelled) setDetail(d);
          } catch {
            if (!cancelled) {
              toast.error('Could not load class details.');
            }
          }
        } else {
          setDetail(null);
        }
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

  const single = classes.length === 1 ? classes[0] : null;
  const classmates = useMemo(() => detail?.students ?? [], [detail]);
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'classmates', label: 'Classmates' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'coursework', label: 'Coursework' },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="My Class"
        subtitle={
          classes.length === 1
            ? 'Coursework dashboard — announcements, assignments, quizzes, and classmates.'
            : 'View your enrolled classes and open each dashboard.'
        }
      />

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
        ) : classes.length > 1 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.classId}
                href={`/student/classes/${c.classId}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.semester || 'Class'}</p>
                <h2 className="mt-2 text-lg font-bold text-foreground group-hover:text-primary">{c.className}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.lecturerName?.trim() || 'Instructor'}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {c.totalCases} cases · {c.totalQuizzes} quizzes
                </p>
              </Link>
            ))}
          </div>
        ) : classes.length === 1 && single ? (
          detail ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-hidden rounded-3xl border border-border shadow-md">
              <div className="relative">
                <ClassDetailCover variant="hero" className="min-h-[200px] sm:min-h-[240px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-6 py-8 sm:px-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Coursework Dashboard</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{detail.className}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-100/90">
                    {detail.semester || 'Current term'} · Instructor:{' '}
                    <span className="font-medium">{detail.lecturerName?.trim() || 'Instructor'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <Button
                    key={t.key}
                    type="button"
                    variant={activeTab === t.key ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {activeTab === 'overview' ? (
                <div className="grid gap-4 p-5 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classmates</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{classmates.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned Cases</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{detail.assignedCases?.length ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quizzes</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{detail.quizzes.length}</p>
                  </div>
                </div>
              ) : null}

              {activeTab === 'classmates' ? (
                <div className="scrollbar-hide overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Student ID</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classmates.length === 0 ? (
                        <tr><td className="px-4 py-6 text-muted-foreground" colSpan={3}>No roster data yet.</td></tr>
                      ) : classmates.map((s) => {
                        const row = s as { email?: string | null; studentEmail?: string | null };
                        const email = row.email?.trim() || row.studentEmail?.trim() || '—';
                        return (
                          <tr key={s.studentId} className="transition-colors hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium text-foreground">{s.studentName || 'Student'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.studentCode?.trim() || s.studentId}</td>
                            <td className="px-4 py-3 text-muted-foreground">{email}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {activeTab === 'announcements' ? (
                <div className="scrollbar-hide overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-foreground">Created</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Title</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.announcements.length === 0 ? (
                        <tr><td className="px-4 py-6 text-muted-foreground" colSpan={3}>No announcements yet.</td></tr>
                      ) : detail.announcements.map((a) => (
                        <tr key={a.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-4 py-3 text-muted-foreground">{formatWhen(a.createdAt)}</td>
                          <td className="px-4 py-3 text-foreground">{a.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{a.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {activeTab === 'coursework' ? (
                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <h3 className="text-sm font-semibold text-foreground">Assigned Cases</h3>
                    </div>
                    <div className="scrollbar-hide overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/20 text-left">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-foreground">Title</th>
                            <th className="px-4 py-3 font-semibold text-foreground">Due Date</th>
                            <th className="px-4 py-3 font-semibold text-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {detail.assignedCases && detail.assignedCases.length > 0 ? (
                            detail.assignedCases.map((c) => (
                              <tr key={c.caseId} className="transition-colors hover:bg-muted/20">
                                <td className="px-4 py-3 text-foreground">{c.title}</td>
                                <td className="px-4 py-3 text-muted-foreground">{c.dueDate ? formatWhen(c.dueDate) : '—'}</td>
                                <td className="px-4 py-3">
                                  <Link href={`/student/cases/${c.caseId}`} className="text-primary hover:underline">Open</Link>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td className="px-4 py-6 text-muted-foreground" colSpan={3}>No assigned cases listed.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <h3 className="text-sm font-semibold text-foreground">Quizzes</h3>
                    </div>
                    <div className="scrollbar-hide overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/20 text-left">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-foreground">Title</th>
                            <th className="px-4 py-3 font-semibold text-foreground">Questions</th>
                            <th className="px-4 py-3 font-semibold text-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {detail.quizzes.length === 0 ? (
                            <tr><td className="px-4 py-6 text-muted-foreground" colSpan={3}>No quizzes yet.</td></tr>
                          ) : detail.quizzes.map((q) => (
                            <tr key={q.quizId} className="transition-colors hover:bg-muted/20">
                              <td className="px-4 py-3 text-foreground">{q.title}</td>
                              <td className="px-4 py-3 text-muted-foreground">{q.totalQuestions}</td>
                              <td className="px-4 py-3">
                                <Link href={`/student/quiz/${q.quizId}`} className="text-primary hover:underline">
                                  {q.isCompleted ? 'Review' : 'Start'}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-foreground">{single.className}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Full coursework data could not be loaded.</p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
