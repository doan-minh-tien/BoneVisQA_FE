'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import StudentPerformanceCard from '@/components/lecturer/StudentPerformanceCard';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BookOpen,
  ArrowLeft,
  Settings,
  Bell,
  Clock,
  Calendar,
  MapPin,
  Plus,
  ChevronRight,
} from 'lucide-react';

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

const classStudents = [
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
  {
    studentName: 'Vo Thi D',
    studentId: 'SE190421',
    averageScore: 85,
    trend: 'up' as const,
    completedCases: 20,
    totalCases: 25,
    lastActivity: '3 hours ago',
    status: 'good' as const,
  },
  {
    studentName: 'Pham Van E',
    studentId: 'SE175620',
    averageScore: 78,
    trend: 'stable' as const,
    completedCases: 18,
    totalCases: 25,
    lastActivity: '1 day ago',
    status: 'good' as const,
  },
  {
    studentName: 'Hoang Thi F',
    studentId: 'SE160640',
    averageScore: 62,
    trend: 'down' as const,
    completedCases: 15,
    totalCases: 25,
    lastActivity: '5 days ago',
    status: 'needs-attention' as const,
  },
];

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

const classAnnouncements = [
  {
    id: '1',
    title: 'Midterm exam schedule updated',
    content: 'The midterm exam has been rescheduled to March 20. Please check the updated schedule and prepare accordingly.',
    date: '2 hours ago',
    priority: 'high' as const,
  },
  {
    id: '2',
    title: 'New case library available',
    content: '15 new bone disease cases have been added to the case library. Students are encouraged to practice with these new cases.',
    date: '1 day ago',
    priority: 'normal' as const,
  },
  {
    id: '3',
    title: 'Guest lecture next week',
    content: 'Dr. Smith from the Orthopedic Research Institute will give a guest lecture on advanced imaging techniques.',
    date: '3 days ago',
    priority: 'normal' as const,
  },
  {
    id: '4',
    title: 'Lab session rescheduled',
    content: 'Due to equipment maintenance, the lab session on Friday has been moved to Saturday 9:00 AM.',
    date: '5 days ago',
    priority: 'high' as const,
  },
];

const statusConfig = {
  active: { color: 'bg-success/10 text-success border-success/20', label: 'Active' },
  upcoming: { color: 'bg-warning/10 text-warning border-warning/20', label: 'Upcoming' },
  completed: { color: 'bg-muted text-muted-foreground border-border', label: 'Completed' },
};

const tabs = ['Students', 'Assignments', 'Announcements', 'Settings'] as const;

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>('Students');

  const classData = classesData[classId] || classesData['1'];
  const config = statusConfig[classData.status];

  const stats = [
    {
      title: 'Students Enrolled',
      value: String(classData.studentCount),
      change: '2 new this week',
      changeType: 'positive' as const,
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Completion Rate',
      value: `${classData.completionRate}%`,
      change: '+3% this month',
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Avg. Score',
      value: `${classData.avgScore}%`,
      change: 'Above average',
      changeType: 'positive' as const,
      icon: Award,
      iconColor: 'bg-warning/10 text-warning',
    },
    {
      title: 'Cases Assigned',
      value: String(classData.totalCases),
      change: '3 in progress',
      changeType: 'neutral' as const,
      icon: BookOpen,
      iconColor: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-auto bg-card border-b border-border px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/lecturer/classes" className="hover:text-primary transition-colors">
            My Classes
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-card-foreground font-medium">{classData.name}</span>
        </div>

        {/* Class Info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-card-foreground">{classData.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{classData.code}</span>
              <span>•</span>
              <span>{classData.cohort}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/lecturer/classes"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors duration-150 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer">
              <Settings className="w-4 h-4" />
              Edit Class
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 cursor-pointer ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-card-foreground'
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
              <p className="text-sm text-muted-foreground">{classStudents.length} students enrolled</p>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Student</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ID</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Avg. Score</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Trend</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Progress</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student, idx) => {
                    const completionRate = Math.round((student.completedCases / student.totalCases) * 100);
                    const studentStatusConfig = {
                      excellent: { color: 'text-success', bgColor: 'bg-success/10', label: 'Excellent' },
                      good: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Good' },
                      'needs-attention': { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Needs Attention' },
                    };
                    const sConfig = studentStatusConfig[student.status];

                    return (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {student.studentName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-sm text-card-foreground">{student.studentName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{student.studentId}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-card-foreground">{student.averageScore}%</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {student.trend === 'up' && <TrendingUp className="w-4 h-4 text-success mx-auto" />}
                          {student.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive mx-auto" />}
                          {student.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground mx-auto" />}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${completionRate}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-16 text-right">{student.completedCases}/{student.totalCases}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sConfig.bgColor} ${sConfig.color}`}>
                            {sConfig.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-muted-foreground">{student.lastActivity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Assignments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{classAssignments.length} assignments</p>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer">
                <Plus className="w-4 h-4" />
                New Assignment
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} {...assignment} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Announcements' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{classAnnouncements.length} announcements</p>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer">
                <Plus className="w-4 h-4" />
                New Announcement
              </button>
            </div>
            <div className="space-y-4">
              {classAnnouncements.map((announcement) => (
                <div key={announcement.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${announcement.priority === 'high' ? 'text-destructive' : 'text-primary'}`} />
                      <h3 className="font-semibold text-card-foreground">{announcement.title}</h3>
                      {announcement.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded">
                          Important
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{announcement.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Information */}
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

            {/* Schedule */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Schedule & Location</h3>
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
    </div>
  );
}
