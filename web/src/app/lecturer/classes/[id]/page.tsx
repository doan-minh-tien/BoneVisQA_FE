'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import ClassManagementWorkbench from '@/components/lecturer/classes/ClassManagementWorkbench';
import { LecturerAnnouncementRow } from '@/components/lecturer/LecturerAnnouncementRow';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import ImportPreviewDialog from '@/components/lecturer/classes/ImportPreviewDialog';
import {
  Users,
  Award,
  ArrowLeft,
  Settings,
  Plus,
  ChevronRight,
  Search,
  Loader2,
  Mail,
  UserMinus,
  UserPlus,
  X,
  MessageSquare,
  Eye,
  Upload,
  Pencil,
  Trash2,
  AlertTriangle,
  FolderOpen,
  BarChart3,
  Clock,
  Megaphone,
} from 'lucide-react';
import {
  getClassById,
  getClassStudents,
  getAvailableStudents,
  enrollStudent,
  removeStudent,
  getClassStats,
  updateClass,
  deleteClass,
  getClassAnnouncements,
} from '@/lib/api/lecturer';
import { getClassQuizzes } from '@/lib/api/lecturer-quiz';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClassItem, StudentEnrollment, ClassStats, QuizDto, Announcement } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';

const tabs = ['Students', 'Assignments', 'Announcements', 'Settings'] as const;

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<string>('Students');

  // Class data
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState('');

  // Stats state
  const [classStats, setClassStats] = useState<ClassStats | null>(null);

  // Students state
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  // Enroll dialog
  const [showEnroll, setShowEnroll] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentEnrollment[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableSearch, setAvailableSearch] = useState('');
  const [enrollingIds, setEnrollingIds] = useState<Set<string>>(new Set());

  // Remove dialog
  const [removeTarget, setRemoveTarget] = useState<StudentEnrollment | null>(null);
  const [removing, setRemoving] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);

  const [classQuizzes, setClassQuizzes] = useState<QuizDto[]>([]);
  const [classQuizzesLoading, setClassQuizzesLoading] = useState(true);
  const [quizRepoSearch, setQuizRepoSearch] = useState('');

  const [classAnnouncements, setClassAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  // Edit class dialog
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete class dialog
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load class detail
  useEffect(() => {
    setClassLoading(true);
    (async () => {
      try {
        const data = await getClassById(classId);
        setClassData(data);
        setEditName(data.className);
        setEditSemester(data.semester);
      } catch (e) {
        setClassError(getApiErrorMessage(e) || 'Failed to load class.');
      } finally {
        setClassLoading(false);
      }
    })();
  }, [classId]);

  const refreshClassRosterAndStats = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([getClassStudents(classId), getClassStats(classId)]);
      setStudents(s);
      setClassStats(st);
    } catch {
      // silently fail
    }
  }, [classId]);

  useEffect(() => {
    setStudentsLoading(true);
    (async () => {
      try {
        const data = await getClassStudents(classId);
        setStudents(data);
      } catch {
        // silently fail
      } finally {
        setStudentsLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await getClassStats(classId);
        setClassStats(data);
      } catch {
        // silently fail
      }
    })();
  }, [classId]);

  useEffect(() => {
    let cancelled = false;
    setClassQuizzesLoading(true);
    (async () => {
      try {
        const list = await getClassQuizzes(classId);
        if (!cancelled) setClassQuizzes(list);
      } catch {
        if (!cancelled) setClassQuizzes([]);
      } finally {
        if (!cancelled) setClassQuizzesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    let cancelled = false;
    setAnnouncementsLoading(true);
    (async () => {
      try {
        const list = await getClassAnnouncements(classId);
        if (!cancelled) setClassAnnouncements(list);
      } catch {
        if (!cancelled) setClassAnnouncements([]);
      } finally {
        if (!cancelled) setAnnouncementsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const handleOpenEnroll = async () => {
    setShowEnroll(true);
    setAvailableLoading(true);
    setAvailableSearch('');
    try {
      const data = await getAvailableStudents(classId);
      setAvailableStudents(data);
    } catch {
      setAvailableStudents([]);
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleEnroll = async (studentId: string) => {
    setEnrollingIds((prev) => new Set(prev).add(studentId));
    try {
      await enrollStudent(classId, studentId);
      // Move from available to enrolled
      const enrolled = availableStudents.find((s) => s.studentId === studentId);
      if (enrolled) {
        setStudents((prev) => [...prev, enrolled]);
        setAvailableStudents((prev) => prev.filter((s) => s.studentId !== studentId));
      }
    } catch {
      // silently fail
    } finally {
      setEnrollingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeStudent(classId, removeTarget.studentId);
      setStudents((prev) => prev.filter((s) => s.studentId !== removeTarget.studentId));
    } catch {
      // silently fail
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  const handleEditClass = async () => {
    if (!editName.trim() || !editSemester.trim()) {
      setEditError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setEditing(true);
    setEditError('');
    try {
      const updated = await updateClass(classId, {
        className: editName.trim(),
        semester: editSemester.trim(),
      });
      setClassData(updated);
      setShowEdit(false);
    } catch (e) {
      setEditError(getApiErrorMessage(e) || 'Cập nhật thất bại.');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleting(true);
    try {
      await deleteClass(classId);
      router.push('/lecturer/classes');
    } catch (e) {
      alert(getApiErrorMessage(e) || 'Xóa thất bại.');
      setDeleting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      (s.studentName?.toLowerCase().includes(q) ?? false) ||
      (s.studentEmail?.toLowerCase().includes(q) ?? false) ||
      (s.studentCode?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredAvailable = availableStudents.filter((s) => {
    const q = availableSearch.toLowerCase();
    return (
      (s.studentName?.toLowerCase().includes(q) ?? false) ||
      (s.studentEmail?.toLowerCase().includes(q) ?? false) ||
      (s.studentCode?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredClassQuizzes = classQuizzes.filter((q) => {
    const s = quizRepoSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      (q.title?.toLowerCase().includes(s) ?? false) ||
      (q.topic?.toLowerCase().includes(s) ?? false)
    );
  });

  const stats = [
    {
      title: 'Students Enrolled',
      value: String(classStats?.totalStudents ?? students.length),
      change: `${students.length} in class`,
      changeType: 'neutral' as const,
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Cases Viewed',
      value: String(classStats?.totalCasesViewed ?? 0),
      change: 'Total views',
      changeType: 'neutral' as const,
      icon: Eye,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Questions Asked',
      value: String(classStats?.totalQuestionsAsked ?? 0),
      change: 'AI Q&A sessions',
      changeType: 'neutral' as const,
      icon: MessageSquare,
      iconColor: 'bg-accent/10 text-accent',
    },
    {
      title: 'Avg. Quiz Score',
      value: classStats?.avgQuizScore != null ? `${Math.round(classStats.avgQuizScore)}%` : '—',
      change: classStats?.avgQuizScore != null ? 'Class average' : 'No quizzes yet',
      changeType: classStats?.avgQuizScore != null ? 'positive' as const : 'neutral' as const,
      icon: Award,
      iconColor: 'bg-warning/10 text-warning',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 border-b border-border/60 backdrop-blur-md px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <Link href="/lecturer" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/lecturer/classes" className="text-sm font-semibold text-primary border-b-2 border-primary pb-1">
                Classes
              </Link>
              <Link href="/lecturer/reports" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Reports
              </Link>
              <Link href="/lecturer/settings" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportPreviewOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              Excel Import
            </button>
            <Link
              href="/lecturer/quizzes/create"
              className="flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary/90 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Assign Quiz
            </Link>
          </div>
        </div>
      </header>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/lecturer/classes" className="hover:text-primary transition-colors">
                Classes
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-primary">{classData?.className ?? '...'}</span>
            </nav>
            {classLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : classError ? (
              <p className="text-sm text-destructive">{classError}</p>
            ) : (
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                {classData?.className}
              </h1>
            )}
            <p className="mt-2 max-w-md text-muted-foreground">
              Manage surgical rotations, import student rosters, and assign diagnostic assessments.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-input transition-colors cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Left Column */}
          <div className="col-span-12 space-y-8 lg:col-span-8">

            <ClassManagementWorkbench
              classId={classId}
              enrolledCount={students.length}
              caseActivityCount={classStats?.totalCasesViewed ?? 0}
              enrolledCapacity={students.length}
              onRosterChanged={refreshClassRosterAndStats}
            />

            {/* Class announcements (same data as /lecturer/announcements, scoped to this class) */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Class announcements</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Students enrolled in this class see these updates. Manage all announcements from the menu or create a new one for this class.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/lecturer/announcements?classId=${encodeURIComponent(classId)}`)
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    Open announcements
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/lecturer/announcements?classId=${encodeURIComponent(classId)}&new=1`,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    New announcement
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                {announcementsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading announcements…
                  </div>
                ) : classAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No announcements yet for this class. Use <strong className="text-foreground">New announcement</strong> above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classAnnouncements.map((a) => (
                      <LecturerAnnouncementRow
                        key={a.id}
                        announcement={{
                          ...a,
                          className: a.className || classData?.className || '',
                        }}
                        onUpdated={(updated) =>
                          setClassAnnouncements((prev) =>
                            prev.map((x) =>
                              x.id === updated.id
                                ? {
                                    ...x,
                                    ...updated,
                                    className:
                                      updated.className || classData?.className || x.className,
                                  }
                                : x,
                            ),
                          )
                        }
                        onDeleted={(id) =>
                          setClassAnnouncements((prev) => prev.filter((x) => x.id !== id))
                        }
                        onError={(msg) => toast.error(msg)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Active Assignments */}
            <div>
              <h4 className="mb-4 text-xl font-bold text-foreground">Active assignments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {([] as any[]).map((assignment) => (
                    <AssignmentCard key={assignment.id} {...assignment} />
                  ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Students' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">{students.length} students enrolled</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-56"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleOpenEnroll}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Student
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                      {students.length === 0 ? 'No students enrolled' : 'No students match your search'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {students.length === 0 ? 'Click "Add Student" to enroll students into this class.' : 'Try a different search term.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Student</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Code</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Email</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Enrolled At</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredStudents.map((student) => (
                          <tr key={student.enrollmentId} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {(student.studentName || '?')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium text-sm text-card-foreground">
                                  {student.studentName || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {student.studentCode || '—'}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                {student.studentEmail || '—'}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {student.enrolledAt
                                ? new Date(student.enrolledAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => setRemoveTarget(student)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Assignments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">0 assignments</p>
                  <Link
                    href={`/lecturer/assignments/create?classId=${classId}`}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Assignment
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([] as any[]).map((assignment) => (
                    <AssignmentCard key={assignment.id} {...assignment} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Announcements' && (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {announcementsLoading
                      ? 'Loading…'
                      : `${classAnnouncements.length} announcement${classAnnouncements.length === 1 ? '' : 's'} for this class`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/lecturer/announcements?classId=${encodeURIComponent(classId)}`)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer"
                    >
                      All announcements
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/lecturer/announcements?classId=${encodeURIComponent(classId)}&new=1`,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </button>
                  </div>
                </div>
                {announcementsLoading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading announcements…
                  </div>
                ) : classAnnouncements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                    <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No announcements yet. Create one for this class.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classAnnouncements.map((a) => (
                      <LecturerAnnouncementRow
                        key={a.id}
                        announcement={{
                          ...a,
                          className: a.className || classData?.className || '',
                        }}
                        onUpdated={(updated) =>
                          setClassAnnouncements((prev) =>
                            prev.map((x) =>
                              x.id === updated.id
                                ? {
                                    ...x,
                                    ...updated,
                                    className:
                                      updated.className || classData?.className || x.className,
                                  }
                                : x,
                            ),
                          )
                        }
                        onDeleted={(id) =>
                          setClassAnnouncements((prev) => prev.filter((x) => x.id !== id))
                        }
                        onError={(msg) => toast.error(msg)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Class Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Class Name</label>
                      <p className="text-sm font-medium text-card-foreground mt-1">
                        {classData?.className ?? '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Semester</label>
                        <p className="text-sm font-medium text-card-foreground mt-1">
                          {classData?.semester ?? '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Created</label>
                        <p className="text-sm font-medium text-card-foreground mt-1">
                          {classData?.createdAt
                            ? new Date(classData.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deleting a class will permanently remove it and all its enrollments. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete this class
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="col-span-12 space-y-8 lg:col-span-4">
            {/* Quizzes for this class — sidebar only (main column stays for workbench + assignments) */}
            <div className="overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="flex items-center gap-2 text-xl font-bold">
                  <FolderOpen className="h-5 w-5 text-secondary" />
                  Quizzes in this class
                </h4>
                <Link
                  href="/lecturer/quizzes"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
                >
                  Quiz Library
                </Link>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Quiz đã gán cho lớp. Để gán thêm, mở quiz trong thư viện và chọn lớp.
              </p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={quizRepoSearch}
                  onChange={(e) => setQuizRepoSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc topic…"
                  className="w-full rounded-lg border-0 bg-white/10 py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-secondary/50 placeholder:text-slate-500"
                />
              </div>
              <div className="max-h-[min(360px,50vh)] space-y-3 overflow-y-auto">
                {classQuizzesLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải…
                  </div>
                ) : classQuizzes.length === 0 ? (
                  <p className="py-4 text-sm text-slate-400">
                    Chưa có quiz nào. Dùng nút trên hoặc thư viện quiz để gán.
                  </p>
                ) : filteredClassQuizzes.length === 0 ? (
                  <p className="py-4 text-sm text-slate-400">Không khớp từ khóa tìm kiếm.</p>
                ) : (
                  filteredClassQuizzes.map((q) => {
                    const meta = [
                      q.topic,
                      q.timeLimit != null ? `${q.timeLimit} min` : null,
                      q.passingScore != null ? `Pass ${q.passingScore}%` : null,
                    ].filter(Boolean) as string[];
                    return (
                      <Link
                        key={q.id}
                        href={`/lecturer/quizzes/${q.id}`}
                        className="block rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
                      >
                        <h6 className="font-bold text-sm leading-snug">{q.title || 'Untitled'}</h6>
                        {meta.length > 0 ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {q.timeLimit != null ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{meta.join(' · ')}</span>
                              </span>
                            ) : (
                              meta.join(' · ')
                            )}
                          </p>
                        ) : null}
                      </Link>
                    );
                  })
                )}
              </div>
              <Link
                href="/lecturer/quizzes"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
              >
                <BarChart3 className="h-4 w-4" />
                Quiz Library
              </Link>
            </div>

            {/* Class Overview */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h5 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Class overview
              </h5>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total enrolled</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. score</span>
                  <span className="font-bold text-secondary">
                    {classStats?.avgQuizScore != null ? `${Math.round(classStats.avgQuizScore)}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quizzes assigned</span>
                  <span className="font-bold">{classQuizzes.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Enroll Dialog */}
      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEnroll(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Add Students</h3>
                <p className="text-sm text-muted-foreground">Select students to enroll into this class</p>
              </div>
              <button
                onClick={() => setShowEnroll(false)}
                className="w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {availableLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading available students...</p>
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {availableStudents.length === 0 ? 'No available students to enroll.' : 'No students match your search.'}
                  </p>
                </div>
              ) : (
                filteredAvailable.map((student) => {
                  const isEnrolling = enrollingIds.has(student.studentId);
                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-input/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {(student.studentName || '?')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {student.studentName || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.studentCode || ''}{student.studentCode && student.studentEmail ? ' · ' : ''}{student.studentEmail || ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEnroll(student.studentId)}
                        disabled={isEnrolling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isEnrolling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        {isEnrolling ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirm Dialog */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRemoveTarget(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <UserMinus className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Remove Student</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Remove <strong className="text-card-foreground">{removeTarget.studentName}</strong> from this class?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Dialog */}
      {importPreviewOpen && (
        <ImportPreviewDialog
          open={true}
          classId={classId}
          onClose={() => setImportPreviewOpen(false)}
          onSuccess={() => {
            setImportPreviewOpen(false);
            refreshClassRosterAndStats();
          }}
        />
      )}

      {/* Edit Class Dialog */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEdit(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">Edit Class</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Class Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Semester</label>
                <input
                  type="text"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  placeholder="e.g. 2026-Spring"
                  className="w-full mt-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                disabled={editing}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {editing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDelete(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Delete Class?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete <strong>{classData?.className}</strong>? All enrollments will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClass}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
