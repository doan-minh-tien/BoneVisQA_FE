'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import ClassManagementWorkbench from '@/components/lecturer/classes/ClassManagementWorkbench';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import ImportPreviewDialog from '@/components/lecturer/classes/ImportPreviewDialog';
import {
  Users,
  Award,
  ArrowLeft,
  Settings,
  Clock,
  Calendar,
  MapPin,
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
  CheckCircle2,
  TrendingUp,
  BarChart3,
  FolderOpen,
  Image,
} from 'lucide-react';
import {
  getClassStudents,
  getAvailableStudents,
  enrollStudent,
  removeStudent,
  getClassStats,
} from '@/lib/api/lecturer';
import type { StudentEnrollment, ClassStats } from '@/lib/api/types';

// Mock class data
const classesData: Record<string, {
  name: string;
  code: string;
  cohort: string;
  status: 'active' | 'upcoming' | 'completed';
  description: string;
  schedule: string;
  room: string;
  startDate: string;
  endDate: string;
  studentCount: number;
  completionRate: number;
  avgScore: number;
  totalCases: number;
}> = {
  '1': {
    name: 'Orthopedics - Advanced Imaging',
    code: 'ORTH-301',
    cohort: 'Year 3 - Cohort 2024',
    status: 'active',
    description: 'Advanced course covering orthopedic imaging techniques including X-ray interpretation, CT analysis, and MRI evaluation for bone disease diagnosis.',
    schedule: 'Mon & Wed, 9:00 - 11:00 AM',
    room: 'Room 301, Medical Building A',
    startDate: 'Jan 6, 2026',
    endDate: 'May 22, 2026',
    studentCount: 68,
    completionRate: 87,
    avgScore: 82,
    totalCases: 24,
  },
  '2': {
    name: 'Musculoskeletal Radiology',
    code: 'RAD-205',
    cohort: 'Year 2 - Cohort 2025',
    status: 'active',
    description: 'Comprehensive study of musculoskeletal system imaging, focusing on bone structure analysis and disease pattern recognition.',
    schedule: 'Tue & Fri, 10:30 AM - 12:30 PM',
    room: 'Room 205, Radiology Center',
    startDate: 'Jan 6, 2026',
    endDate: 'May 22, 2026',
    studentCount: 72,
    completionRate: 92,
    avgScore: 88,
    totalCases: 24,
  },
  '3': {
    name: 'Clinical Practice - Bone Diseases',
    code: 'CLIN-401',
    cohort: 'Year 4 - Cohort 2023',
    status: 'active',
    description: 'Hands-on clinical practice for diagnosing and managing various bone diseases using visual question answering techniques.',
    schedule: 'Mon, 1:00 - 4:00 PM',
    room: 'Clinical Lab 2, Hospital Wing',
    startDate: 'Jan 6, 2026',
    endDate: 'May 22, 2026',
    studentCount: 44,
    completionRate: 95,
    avgScore: 91,
    totalCases: 25,
  },
};


const classAssignments = [
  {
    id: '1',
    title: 'Case Analysis: Complex Tibial Fractures',
    className: 'ORTH-301',
    dueDate: 'Today, 11:59 PM',
    totalStudents: 68,
    submitted: 52,
    graded: 28,
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Quiz: Bone Density Assessment',
    className: 'ORTH-301',
    dueDate: 'Mar 15, 2026',
    totalStudents: 68,
    submitted: 0,
    graded: 0,
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Lab Report: X-ray Interpretation',
    className: 'ORTH-301',
    dueDate: 'Feb 28, 2026',
    totalStudents: 68,
    submitted: 68,
    graded: 68,
    status: 'completed' as const,
  },
  {
    id: '4',
    title: 'Midterm: Orthopedic Imaging Fundamentals',
    className: 'ORTH-301',
    dueDate: 'Feb 14, 2026',
    totalStudents: 68,
    submitted: 67,
    graded: 67,
    status: 'completed' as const,
  },
];


const statusConfig = {
  active: { color: 'bg-success/10 text-success border-success/20', label: 'Active' },
  upcoming: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Upcoming' },
  completed: { color: 'bg-muted text-muted-foreground border-border', label: 'Completed' },
};

const tabs = ['Students', 'Assignments', 'Settings'] as const;

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = use(params);
  const [activeTab, setActiveTab] = useState<string>('Students');

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

  const classData = classesData[classId] || classesData['1'];
  const config = statusConfig[classData.status];

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
                Admin
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-primary">Class Management</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {classData.name}
            </h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              Manage surgical rotations, import student rosters, and assign diagnostic assessments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Left Column */}
          <div className="col-span-12 space-y-8 lg:col-span-8">

            <ClassManagementWorkbench
              classId={classId}
              enrolledCount={students.length}
              caseActivityCount={classStats?.totalCasesViewed ?? 0}
              enrolledCapacity={classData.studentCount}
              onRosterChanged={refreshClassRosterAndStats}
            />

            {/* Active Assignments */}
            <div>
              <h4 className="mb-4 text-xl font-bold text-foreground">Active assignments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classAssignments.map((assignment) => (
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
                  <p className="text-sm text-muted-foreground">{classAssignments.length} assignments</p>
                  <Link
                    href={`/lecturer/assignments/create?classId=${classId}`}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Assignment
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classAssignments.map((assignment) => (
                    <AssignmentCard key={assignment.id} {...assignment} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Class Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Description</label>
                      <p className="text-sm text-card-foreground mt-1">{classData.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Class Code</label>
                        <p className="text-sm font-medium text-card-foreground mt-1">{classData.code}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Cohort</label>
                        <p className="text-sm font-medium text-card-foreground mt-1">{classData.cohort}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Schedule &amp; Location</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Schedule</p>
                        <p className="text-sm font-medium text-card-foreground">{classData.schedule}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-card-foreground">{classData.room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium text-card-foreground">{classData.startDate} — {classData.endDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="col-span-12 space-y-8 lg:col-span-4">
            {/* Quiz Repository */}
            <div className="overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
              <h4 className="mb-6 flex items-center gap-2 text-xl font-bold">
                <FolderOpen className="h-5 w-5 text-secondary" />
                Quiz repository
              </h4>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search curated quizzes…"
                  className="w-full rounded-lg border-0 bg-white/10 py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-secondary/50 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-4">
                {[
                  { tag: 'Trauma', tagClass: 'bg-secondary/20 text-secondary', title: 'Pediatric Growth Plate Injuries', imgs: 15, mins: 20 },
                  { tag: 'Pathology', tagClass: 'bg-amber-200/20 text-amber-200', title: 'Bone Tumor Differential Dx', imgs: 10, mins: 45 },
                  { tag: 'Anatomy', tagClass: 'bg-primary/20 text-primary-fixed', title: 'Advanced Carpometacarpal Review', imgs: 24, mins: 30 },
                ].map((quiz, i) => (
                  <div
                    key={i}
                    className="group cursor-pointer rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${quiz.tagClass}`}>
                        {quiz.tag}
                      </span>
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        <TrendingUp className="h-4 w-4 text-white/50" />
                      </span>
                    </div>
                    <h6 className="font-bold text-sm">{quiz.title}</h6>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        {quiz.imgs}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.mins}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
              >
                <BarChart3 className="h-4 w-4" />
                Assign selected to class
              </button>
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
                  <span className="text-sm text-muted-foreground">Active curricula</span>
                  <span className="font-bold">{classAssignments.filter((a) => a.status === 'active').length}</span>
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
    </div>
  );
}
