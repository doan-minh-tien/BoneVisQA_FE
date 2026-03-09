import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import ClassCard from '@/components/lecturer/ClassCard';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import StudentPerformanceCard from '@/components/lecturer/StudentPerformanceCard';
import {
  Users,
  ClipboardList,
  TrendingUp,
  Award,
  Plus,
  Bell,
  BarChart3,
  Calendar,
  MessageSquare,
} from 'lucide-react';

// Mock data
const lecturerStats = [
  {
    title: 'Total Students',
    value: '184',
    change: '+12 this semester',
    changeType: 'positive' as const,
    icon: Users,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Active Classes',
    value: '3',
    change: 'All on track',
    changeType: 'neutral' as const,
    icon: ClipboardList,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Avg. Class Performance',
    value: '87%',
    change: '+5% improvement',
    changeType: 'positive' as const,
    icon: TrendingUp,
    iconColor: 'bg-success/10 text-success',
  },
  {
    title: 'Completion Rate',
    value: '92%',
    change: 'Above target',
    changeType: 'positive' as const,
    icon: Award,
    iconColor: 'bg-warning/10 text-warning',
  },
];

const activeClasses = [
  {
    id: '1',
    name: 'Orthopedics - Advanced Imaging',
    code: 'ORTH-301',
    cohort: 'Year 3 - Cohort 2024',
    studentCount: 68,
    completionRate: 87,
    nextSession: 'Tomorrow, 9:00 AM',
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Musculoskeletal Radiology',
    code: 'RAD-205',
    cohort: 'Year 2 - Cohort 2025',
    studentCount: 72,
    completionRate: 92,
    nextSession: 'Friday, 10:30 AM',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Clinical Practice - Bone Diseases',
    code: 'CLIN-401',
    cohort: 'Year 4 - Cohort 2023',
    studentCount: 44,
    completionRate: 95,
    nextSession: 'Next Monday, 1:00 PM',
    status: 'active' as const,
  },
];

const pendingAssignments = [
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
    title: 'Quiz: Knee Osteoarthritis Classification',
    className: 'RAD-205',
    dueDate: 'Tomorrow, 11:59 PM',
    totalStudents: 72,
    submitted: 45,
    graded: 45,
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Practical Exam: X-ray Interpretation',
    className: 'CLIN-401',
    dueDate: 'Jan 25, 2026',
    totalStudents: 44,
    submitted: 8,
    graded: 2,
    status: 'overdue' as const,
  },
];

const topPerformers = [
  {
    studentName: 'Nguyen Van A',
    studentId: 'SE171589',
    averageScore: 96,
    trend: 'up' as const,
    completedCases: 24,
    totalCases: 25,
    lastActivity: '2 hours ago',
    status: 'excellent' as const,
  },
  {
    studentName: 'Tran Thi B',
    studentId: 'SE182539',
    averageScore: 94,
    trend: 'up' as const,
    completedCases: 23,
    totalCases: 25,
    lastActivity: '5 hours ago',
    status: 'excellent' as const,
  },
  {
    studentName: 'Le Van C',
    studentId: 'SE183031',
    averageScore: 91,
    trend: 'stable' as const,
    completedCases: 22,
    totalCases: 25,
    lastActivity: '1 day ago',
    status: 'good' as const,
  },
];

const needsAttention = [
  {
    studentName: 'Pham Thi D',
    studentId: 'SE160640',
    averageScore: 62,
    trend: 'down' as const,
    completedCases: 15,
    totalCases: 25,
    lastActivity: '5 days ago',
    status: 'needs-attention' as const,
  },
  {
    studentName: 'Hoang Van E',
    studentId: 'SE175421',
    averageScore: 68,
    trend: 'down' as const,
    completedCases: 17,
    totalCases: 25,
    lastActivity: '3 days ago',
    status: 'needs-attention' as const,
  },
];

const recentAnnouncements = [
  { title: 'New case library update', date: '2 hours ago', priority: 'normal' },
  { title: 'Midterm exam schedule', date: '1 day ago', priority: 'high' },
  { title: 'Guest lecture next week', date: '2 days ago', priority: 'normal' },
];

export default function LecturerDashboardPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Lecturer Dashboard"
        subtitle="Manage classes and track student progress"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {lecturerStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer">
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Assignment</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors duration-150 cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Send Announcement</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">View Analytics</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Classes & Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Classes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">My Classes</h2>
                  <p className="text-sm text-muted-foreground">3 active classes this semester</p>
                </div>
                <a href="/lecturer/classes" className="text-sm text-primary hover:underline cursor-pointer">
                  View all
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeClasses.slice(0, 2).map((class_) => (
                  <ClassCard key={class_.id} {...class_} />
                ))}
              </div>
            </div>

            {/* Pending Assignments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Pending Assignments</h2>
                  <p className="text-sm text-muted-foreground">8 assignments require attention</p>
                </div>
                <a href="/lecturer/assignments" className="text-sm text-primary hover:underline cursor-pointer">
                  View all
                </a>
              </div>
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} {...assignment} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Student Performance */}
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">Top Performers</h2>
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div className="space-y-3">
                {topPerformers.map((student, idx) => (
                  <StudentPerformanceCard key={idx} {...student} />
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-card rounded-xl border border-destructive/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">Needs Attention</h2>
                <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded">
                  {needsAttention.length} students
                </span>
              </div>
              <div className="space-y-3">
                {needsAttention.map((student, idx) => (
                  <StudentPerformanceCard key={idx} {...student} />
                ))}
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Announcements</h2>
              <div className="space-y-3">
                {recentAnnouncements.map((announcement, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <Bell className={`w-4 h-4 mt-0.5 ${announcement.priority === 'high' ? 'text-destructive' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground">{announcement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">12</p>
            <p className="text-sm text-muted-foreground">Sessions This Week</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">28</p>
            <p className="text-sm text-muted-foreground">Student Questions</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <ClipboardList className="w-6 h-6 text-warning" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">45</p>
            <p className="text-sm text-muted-foreground">Pending Gradings</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">+8%</p>
            <p className="text-sm text-muted-foreground">Performance Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
}
