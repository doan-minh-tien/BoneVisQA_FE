'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ClassDetailCover } from '@/components/student/ClassDetailVisuals';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import { useToast } from '@/components/ui/toast';
import {
  fetchStudentClassDetail,
  fetchStudentClasses,
  type StudentClassDetail,
  type StudentClassItem,
} from '@/lib/api/student';
import { resolveApiAssetUrl } from '@/lib/api/client';
import {
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Stethoscope,
  Users,
} from 'lucide-react';

type ClassTab = 'roster' | 'cases' | 'quizzes' | 'announcements';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function StudentClassDetailPage() {
  const params = useParams();
  const toast = useToast();
  const classId = String(params?.id ?? '');

  const [summary, setSummary] = useState<StudentClassItem | null>(null);
  const [detail, setDetail] = useState<StudentClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ClassTab>('roster');

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setDetail(null);
    setSummary(null);
    try {
      const classes = await fetchStudentClasses();
      const found = classes.find((c) => c.classId === classId) ?? null;
      setSummary(found);
      const d = await fetchStudentClassDetail(classId);
      setDetail(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load this class.');
    } finally {
      setLoading(false);
    }
  }, [classId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = detail?.className ?? summary?.className ?? 'Class';
  const semester = detail?.semester ?? summary?.semester ?? '';
  const lecturerName = detail?.lecturerName?.trim() || summary?.lecturerName?.trim() || 'Instructor';
  const expertName = detail?.expertName?.trim();
  const expertEmail = detail?.expertEmail?.trim();
  const expertAvatarSrc = detail?.expertAvatarUrl
    ? resolveApiAssetUrl(detail.expertAvatarUrl)
    : '';

  const classmates = useMemo(() => {
    if (!detail?.students?.length) return [];
    return detail.students;
  }, [detail]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title={title} subtitle="Class roster, case assignments, quizzes, and announcements." />

      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/classes" className="hover:text-foreground">
            Classes
          </Link>
          <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
          <span className="truncate text-foreground">{title}</span>
        </nav>

        {loading ? (
          <PageLoadingSkeleton>
            <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-10 w-4/5 max-w-lg sm:h-12" />
                <div className="mt-6 flex flex-wrap gap-3">
                  <SkeletonBlock className="h-[4.75rem] w-56 max-w-full rounded-2xl" />
                  <SkeletonBlock className="h-[4.75rem] w-56 max-w-full rounded-2xl" />
                </div>
              </div>
              <SkeletonBlock className="min-h-[12rem] rounded-2xl border border-border shadow-md" />
            </div>
            <SkeletonBlock className="mb-6 h-[3.25rem] w-full max-w-4xl rounded-xl" />
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <SkeletonBlock className="mb-1 h-7 w-44" />
              <SkeletonBlock className="h-4 w-full max-w-md" />
              <div className="mt-6 divide-y divide-border">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonBlock className="h-4 w-48 max-w-full" />
                      <SkeletonBlock className="h-3 w-28 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PageLoadingSkeleton>
        ) : !detail ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">This class could not be loaded or you are not enrolled.</p>
            <Link
              href="/student/classes"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted/60"
            >
              Back to classes
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{semester || 'Curriculum'}</p>
                <h1 className="mt-1 font-['Manrope',sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <div className="mt-6 flex max-w-lg flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                      {initials(lecturerName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecturer</p>
                      <p className="truncate text-sm font-semibold text-foreground">{lecturerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                    {expertAvatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={expertAvatarSrc}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                        {expertName ? (
                          <span className="text-xs font-bold">{initials(expertName)}</span>
                        ) : (
                          <Stethoscope className="h-5 w-5" aria-hidden />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expert</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {expertName || 'Not assigned'}
                      </p>
                      {expertEmail ? (
                        <p className="truncate text-xs text-muted-foreground">{expertEmail}</p>
                      ) : !expertName ? (
                        <p className="text-xs text-muted-foreground">Shown when your school assigns a reviewer.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border shadow-md">
                <ClassDetailCover variant="hero" className="min-h-[12rem]" />
              </div>
            </header>

            <div
              className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1"
              role="tablist"
              aria-label="Class sections"
            >
              {(
                [
                  ['roster', 'Classmates', Users],
                  ['cases', 'Assigned cases', GraduationCap],
                  ['quizzes', 'Quizzes', ClipboardList],
                  ['announcements', 'Announcements', Megaphone],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    tab === id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setTab(id)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {tab === 'roster' && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Class roster</h2>
                <p className="mt-1 text-sm text-muted-foreground">Peers enrolled in this cohort.</p>
                {classmates.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">No roster data yet.</p>
                ) : (
                  <ul className="mt-6 divide-y divide-border">
                    {classmates.map((s) => (
                      <li key={s.studentId} className="flex items-center gap-3 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
                          {initials(s.studentName || '?')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{s.studentName}</p>
                          <p className="text-xs text-muted-foreground">{s.studentCode?.trim() || 'Student'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'cases' && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Assigned cases</h2>
                <p className="mt-1 text-sm text-muted-foreground">Cases your lecturer assigned to this class.</p>
                <div className="mt-6 space-y-3">
                  {detail.assignedCases && detail.assignedCases.length > 0 ? (
                    detail.assignedCases.map((c) => (
                      <div
                        key={c.caseId}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.dueDate ? `Due ${formatWhen(c.dueDate)}` : 'Due date TBA'}
                            {c.isMandatory ? ' · Required' : ''}
                          </p>
                        </div>
                        <Link
                          href={`/student/cases/${c.caseId}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted/60"
                        >
                          Open
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                      No assigned cases are listed for this class yet. Browse the{' '}
                      <Link href="/student/catalog" className="font-semibold text-primary underline-offset-4 hover:underline">
                        case catalog
                      </Link>{' '}
                      for self-paced study.
                    </div>
                  )}
                </div>
              </section>
            )}

            {tab === 'quizzes' && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Class quizzes</h2>
                <p className="mt-1 text-sm text-muted-foreground">Micro quizzes tied to this class.</p>
                {detail.quizzes.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">No quizzes assigned yet.</p>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {detail.quizzes.map((q) => (
                      <li
                        key={q.quizId}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{q.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.totalQuestions} questions
                            {q.timeLimit != null ? ` · ${q.timeLimit} min` : ''}
                            {q.isCompleted && q.score != null ? ` · Score ${Math.round(q.score)}%` : ''}
                          </p>
                        </div>
                        <Link
                          href={`/student/quiz/${q.quizId}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-primary bg-primary px-3 text-xs font-medium text-white hover:opacity-95"
                        >
                          {q.isCompleted ? 'Review' : 'Start'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'announcements' && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
                <p className="mt-1 text-sm text-muted-foreground">Updates from your lecturer.</p>
                {detail.announcements.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-foreground">No announcements yet.</p>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {detail.announcements.map((a) => (
                      <li key={a.id} className="rounded-xl border border-border bg-background px-4 py-4">
                        <p className="text-xs text-muted-foreground">{formatWhen(a.createdAt)}</p>
                        <h3 className="mt-1 font-semibold text-foreground">{a.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
