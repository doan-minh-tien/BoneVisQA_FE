'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Loader2,
  Megaphone,
  Plus,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';
import { ClassDetailCover } from '@/components/student/ClassDetailVisuals';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/shared/EmptyState';
import { LecturerAnnouncementRow } from '@/components/lecturer/LecturerAnnouncementRow';
import type { Announcement, CaseDto, ClassItem, QuizDto, StudentEnrollment } from '@/lib/api/types';
import { getClassAnnouncements } from '@/lib/api/lecturer';
import {
  ForbiddenApiError,
  assignCasesToLecturerClass,
  assignQuizToLecturerClass,
  fetchAssignedCases,
  fetchAssignedQuizzes,
  fetchClassStudents,
  fetchLecturerCaseLibrary,
  fetchLecturerClassById,
  fetchLecturerQuizLibrary,
} from '@/lib/api/lecturer-classes';

type DetailTab = 'students' | 'cases' | 'quizzes' | 'announcements';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function LecturerClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<DetailTab>('students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const [classInfo, setClassInfo] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [assignedCases, setAssignedCases] = useState<CaseDto[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<QuizDto[]>([]);
  const [classAnnouncements, setClassAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const [assignCasesOpen, setAssignCasesOpen] = useState(false);
  const [caseLibrary, setCaseLibrary] = useState<CaseDto[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [caseDueDate, setCaseDueDate] = useState('');
  const [caseMandatory, setCaseMandatory] = useState(true);
  const [assignCasesSubmitting, setAssignCasesSubmitting] = useState(false);

  const [assignQuizOpen, setAssignQuizOpen] = useState(false);
  const [quizLibrary, setQuizLibrary] = useState<QuizDto[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizOpenTime, setQuizOpenTime] = useState('');
  const [quizCloseTime, setQuizCloseTime] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState('60');
  const [quizPassingScore, setQuizPassingScore] = useState('70');
  const [assignQuizSubmitting, setAssignQuizSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setAnnouncementsLoading(true);
      try {
        const [klass, classStudents, classCases, classQuizzes, announcements] = await Promise.all([
          fetchLecturerClassById(classId),
          fetchClassStudents(classId),
          fetchAssignedCases(classId),
          fetchAssignedQuizzes(classId),
          getClassAnnouncements(classId),
        ]);
        if (ignore) return;
        setClassInfo(klass);
        setStudents(classStudents);
        setAssignedCases(classCases);
        setAssignedQuizzes(classQuizzes);
        setClassAnnouncements(Array.isArray(announcements) ? announcements : []);
      } catch (err) {
        if (ignore) return;
        if (err instanceof ForbiddenApiError) {
          setForbidden(true);
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load class workbench.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setAnnouncementsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [classId]);

  const availableCasesToAssign = useMemo(
    () => caseLibrary.filter((item) => !assignedCases.some((assigned) => assigned.id === item.id)),
    [assignedCases, caseLibrary],
  );

  const availableQuizzesToAssign = useMemo(
    () => quizLibrary.filter((item) => !assignedQuizzes.some((assigned) => assigned.id === item.id)),
    [assignedQuizzes, quizLibrary],
  );

  const onOpenAssignCases = async () => {
    setAssignCasesOpen(true);
    try {
      const data = await fetchLecturerCaseLibrary();
      setCaseLibrary(data);
      setSelectedCaseIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load case library.');
    }
  };

  const onAssignCases = async () => {
    if (selectedCaseIds.size === 0) return;
    setAssignCasesSubmitting(true);
    try {
      const ids = Array.from(selectedCaseIds);
      await assignCasesToLecturerClass(classId, {
        caseIds: ids,
        dueDate: caseDueDate || undefined,
        isMandatory: caseMandatory,
      });
      const newlyAssigned = caseLibrary.filter((item) => ids.includes(item.id));
      setAssignedCases((prev) => [...prev, ...newlyAssigned]);
      setAssignCasesOpen(false);
      toast.success('Cases assigned successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Case assignment failed.');
    } finally {
      setAssignCasesSubmitting(false);
    }
  };

  const onOpenAssignQuiz = async () => {
    setAssignQuizOpen(true);
    try {
      const data = await fetchLecturerQuizLibrary();
      setQuizLibrary(data);
      setSelectedQuizId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load quiz library.');
    }
  };

  const onAssignQuiz = async () => {
    if (!selectedQuizId) {
      toast.error('Please select a quiz to assign.');
      return;
    }
    setAssignQuizSubmitting(true);
    try {
      await assignQuizToLecturerClass(classId, {
        quizId: selectedQuizId,
        openTime: quizOpenTime || undefined,
        closeTime: quizCloseTime || undefined,
        timeLimitMinutes: Number(quizTimeLimit) || undefined,
        passingScore: Number(quizPassingScore) || undefined,
      });
      const quiz = quizLibrary.find((item) => item.id === selectedQuizId);
      if (quiz) setAssignedQuizzes((prev) => [...prev, quiz]);
      setAssignQuizOpen(false);
      toast.success('Quiz assigned successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Quiz assignment failed.');
    } finally {
      setAssignQuizSubmitting(false);
    }
  };

  const displayTitle = classInfo?.className ?? 'Class workbench';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title={displayTitle}
        subtitle={
          classInfo
            ? `Semester ${classInfo.semester} — assign cases and quizzes; roster changes are admin-only.`
            : 'Class workbench'
        }
      />

      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/lecturer/classes" className="transition-colors hover:text-foreground">
            Classes
          </Link>
          <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
          <span className="truncate text-foreground">{displayTitle}</span>
        </nav>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/lecturer/classes"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to classes
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/lecturer/announcements?classId=${encodeURIComponent(classId)}`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted/60"
            >
              <Megaphone className="h-4 w-4" />
              Announcements
            </Link>
            <Link
              href={`/lecturer/assignments/create?classId=${encodeURIComponent(classId)}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted/60"
            >
              Assignments
            </Link>
            <Link
              href="/lecturer/quizzes/create"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted/60"
            >
              New quiz
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-sm text-muted-foreground animate-pulse">
            Loading class workbench…
          </div>
        ) : forbidden ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="You do not have permission to manage this class"
            description={error || 'Please contact your administrator for access.'}
          />
        ) : error ? (
          <EmptyState title="Unable to load class workbench" description={error} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {classInfo ? (
              <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    {classInfo.semester || 'Curriculum'}
                  </p>
                  <h1 className="mt-1 font-['Manrope',sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {classInfo.className}
                  </h1>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Enrollment</p>
                        <p className="text-sm font-semibold text-foreground">{students.length} students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary">
                        <Stethoscope className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Assigned expert</p>
                        <p className="text-sm font-semibold text-foreground">
                          {classInfo.expertName?.trim() || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-primary">
                        <Calendar className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(classInfo.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border shadow-md">
                  <ClassDetailCover variant="hero" className="min-h-[12rem]" />
                </div>
              </header>
            ) : null}

            <div
              className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1"
              role="tablist"
              aria-label="Class sections"
            >
              {(
                [
                  ['students', 'Students', Users, students.length],
                  ['cases', 'Cases', GraduationCap, assignedCases.length],
                  ['quizzes', 'Quizzes', ClipboardList, assignedQuizzes.length],
                  ['announcements', 'Announcements', Megaphone, classAnnouncements.length],
                ] as const
              ).map(([id, label, Icon, count]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  className={`flex min-w-[calc(50%-4px)] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:min-w-0 ${
                    activeTab === id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {label} ({count})
                  </span>
                </button>
              ))}
            </div>

            {activeTab === 'students' ? (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Class roster</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Learners enrolled in this cohort. Adding or removing students is handled by an administrator.
                  </p>
                </div>
                {students.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-7 w-7 opacity-90" />}
                    title="No enrolled students yet"
                    description="When an administrator enrolls students in this class, they will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[520px]">
                      <thead className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {students.map((student) => (
                          <tr
                            key={student.studentId}
                            className="transition-colors hover:bg-muted/40"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
                                  {initials(student.studentName || '?')}
                                </div>
                                <span className="text-sm font-medium text-card-foreground">
                                  {student.studentName || 'Unknown student'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{student.studentCode || '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{student.studentEmail || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === 'cases' ? (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Assigned cases</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Cases linked to this class for guided practice.</p>
                  </div>
                  <Button onClick={onOpenAssignCases}>Assign Cases</Button>
                </div>
                {assignedCases.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-7 w-7 opacity-90" />}
                    title="No cases assigned"
                    description="Pull cases from your library so students see them in this class."
                    action={<Button onClick={onOpenAssignCases}>Assign cases</Button>}
                  />
                ) : (
                  <div className="mt-6 space-y-3">
                    {assignedCases.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title || 'Untitled case'}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description || 'No description available.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === 'quizzes' ? (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Class quizzes</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Micro quizzes tied to this class.</p>
                  </div>
                  <Button onClick={onOpenAssignQuiz}>Assign Quiz</Button>
                </div>
                {assignedQuizzes.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="h-7 w-7 opacity-90" />}
                    title="No quizzes assigned"
                    description="Assign a quiz from your library to schedule practice and assessment."
                    action={<Button onClick={onOpenAssignQuiz}>Assign quiz</Button>}
                  />
                ) : (
                  <div className="mt-6 space-y-3">
                    {assignedQuizzes.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title || 'Untitled quiz'}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.topic || 'General topic'} — Pass score {item.passingScore ?? 70}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === 'announcements' ? (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Updates visible to students in this class.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/lecturer/announcements?classId=${encodeURIComponent(classId)}`)
                      }
                    >
                      Manage all
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        router.push(`/lecturer/announcements?classId=${encodeURIComponent(classId)}&new=1`)
                      }
                    >
                      <Plus className="h-4 w-4" />
                      New announcement
                    </Button>
                  </div>
                </div>
                {announcementsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading announcements…
                  </div>
                ) : classAnnouncements.length === 0 ? (
                  <EmptyState
                    icon={<Megaphone className="h-7 w-7 opacity-90" />}
                    title="No announcements yet"
                    description="Post updates, deadlines, or reminders for everyone enrolled in this class."
                    action={
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          router.push(`/lecturer/announcements?classId=${encodeURIComponent(classId)}&new=1`)
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Create announcement
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {classAnnouncements.map((a) => (
                      <LecturerAnnouncementRow
                        key={a.id}
                        announcement={{
                          ...a,
                          className: a.className || classInfo?.className || '',
                        }}
                        showClassName={false}
                        onUpdated={(updated) =>
                          setClassAnnouncements((prev) =>
                            prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
                          )
                        }
                        onDeleted={(id) => setClassAnnouncements((prev) => prev.filter((x) => x.id !== id))}
                        onError={(msg) => toast.error(msg)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        )}
      </div>

      <Modal
        open={assignCasesOpen}
        onClose={() => !assignCasesSubmitting && setAssignCasesOpen(false)}
        title="Assign Cases"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignCasesOpen(false)} disabled={assignCasesSubmitting}>
              Cancel
            </Button>
            <Button onClick={onAssignCases} isLoading={assignCasesSubmitting} disabled={selectedCaseIds.size === 0}>
              Assign Cases
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Due Date</label>
            <Input type="datetime-local" value={caseDueDate} onChange={(e) => setCaseDueDate(e.target.value)} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-card-foreground md:mt-8">
            <input type="checkbox" checked={caseMandatory} onChange={(e) => setCaseMandatory(e.target.checked)} />
            Mandatory assignment
          </label>
        </div>
        {availableCasesToAssign.length === 0 ? (
          <EmptyState title="No available cases" description="All cases in your library are already assigned." />
        ) : (
          <div className="space-y-2">
            {availableCasesToAssign.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
                <input
                  type="checkbox"
                  checked={selectedCaseIds.has(item.id)}
                  onChange={() =>
                    setSelectedCaseIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.title || 'Untitled case'}</p>
                  <p className="text-xs text-muted-foreground">{item.description || 'No description'}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={assignQuizOpen}
        onClose={() => !assignQuizSubmitting && setAssignQuizOpen(false)}
        title="Assign Quiz"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignQuizOpen(false)} disabled={assignQuizSubmitting}>
              Cancel
            </Button>
            <Button onClick={onAssignQuiz} isLoading={assignQuizSubmitting}>
              Assign Quiz
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Quiz</label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">Select quiz</option>
              {availableQuizzesToAssign.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title || 'Untitled quiz'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Open Time</label>
              <Input type="datetime-local" value={quizOpenTime} onChange={(e) => setQuizOpenTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Close Time</label>
              <Input type="datetime-local" value={quizCloseTime} onChange={(e) => setQuizCloseTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Time Limit (minutes)</label>
              <Input type="number" min={1} value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Passing Score (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quizPassingScore}
                onChange={(e) => setQuizPassingScore(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
