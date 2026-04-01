'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import {
  Users,
  CheckCircle,
  Clock,
  Award,
  ChevronRight,
  ArrowLeft,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const assignmentsData: Record<string, {
  title: string;
  className: string;
  classCode: string;
  type: string;
  status: 'active' | 'overdue' | 'completed';
  dueDate: string;
  description: string;
  instructions: string;
  maxScore: number;
  allowLate: boolean;
  totalStudents: number;
  submitted: number;
  graded: number;
  avgScore: number;
  createdAt: string;
}> = {
  '1': {
    title: 'Case Analysis: Complex Tibial Fractures',
    className: 'Orthopedics - Advanced Imaging',
    classCode: 'ORTH-301',
    type: 'Case Analysis',
    status: 'active',
    dueDate: 'Mar 9, 2026, 11:59 PM',
    description: 'Analyze complex tibial fracture cases using X-ray and CT imaging. Students must identify fracture patterns, classify severity, and propose treatment plans.',
    instructions: '1. Review the provided imaging cases (5 cases total)\n2. For each case, identify the fracture type and classification\n3. Write a diagnostic report with treatment recommendations\n4. Submit your analysis as a PDF document',
    maxScore: 100,
    allowLate: true,
    totalStudents: 68,
    submitted: 52,
    graded: 28,
    avgScore: 85,
    createdAt: 'Feb 20, 2026',
  },
  '2': {
    title: 'Quiz: Knee Osteoarthritis Classification',
    className: 'Musculoskeletal Radiology',
    classCode: 'RAD-205',
    type: 'Quiz',
    status: 'active',
    dueDate: 'Mar 10, 2026, 11:59 PM',
    description: 'Online quiz covering knee osteoarthritis classification systems including Kellgren-Lawrence grading.',
    instructions: 'Complete the quiz within 60 minutes. No external resources allowed.',
    maxScore: 50,
    allowLate: false,
    totalStudents: 72,
    submitted: 45,
    graded: 45,
    avgScore: 78,
    createdAt: 'Mar 1, 2026',
  },
  '3': {
    title: 'Practical Exam: X-ray Interpretation',
    className: 'Clinical Practice - Bone Diseases',
    classCode: 'CLIN-401',
    type: 'Practical Exam',
    status: 'overdue',
    dueDate: 'Jan 25, 2026',
    description: 'Practical examination on interpreting various X-ray images for bone disease diagnosis.',
    instructions: 'Interpret 10 X-ray images. Identify abnormalities and provide differential diagnosis.',
    maxScore: 100,
    allowLate: false,
    totalStudents: 44,
    submitted: 8,
    graded: 2,
    avgScore: 72,
    createdAt: 'Jan 10, 2026',
  },
};

const submissions = [
  { studentName: 'Nguyen Van A', studentId: 'SE171589', submittedDate: 'Mar 8, 10:30 AM', score: 95, status: 'graded' as const },
  { studentName: 'Tran Thi B', studentId: 'SE182539', submittedDate: 'Mar 8, 2:15 PM', score: 88, status: 'graded' as const },
  { studentName: 'Le Van C', studentId: 'SE183031', submittedDate: 'Mar 7, 9:00 AM', score: 82, status: 'graded' as const },
  { studentName: 'Vo Thi D', studentId: 'SE190421', submittedDate: 'Mar 9, 8:45 AM', score: null, status: 'pending' as const },
  { studentName: 'Pham Van E', studentId: 'SE175620', submittedDate: 'Mar 8, 11:20 PM', score: null, status: 'pending' as const },
  { studentName: 'Hoang Thi F', studentId: 'SE160640', submittedDate: null, score: null, status: 'not-submitted' as const },
];

const statusConfig = {
  active: { color: 'bg-primary/10 text-primary border-primary/20', label: 'Active' },
  overdue: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Overdue' },
  completed: { color: 'bg-success/10 text-success border-success/20', label: 'Completed' },
};

const submissionStatusConfig = {
  graded: { color: 'text-success', bgColor: 'bg-success/10', label: 'Graded' },
  pending: { color: 'text-warning', bgColor: 'bg-warning/10', label: 'Pending' },
  'not-submitted': { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Not Submitted' },
};

const tabs = ['Submissions', 'Settings'] as const;

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assignmentId } = use(params);
  const [activeTab, setActiveTab] = useState<string>('Submissions');

  const assignment = assignmentsData[assignmentId] || assignmentsData['1'];
  const config = statusConfig[assignment.status];

  const submissionRate = Math.round((assignment.submitted / assignment.totalStudents) * 100);
  const gradingProgress = assignment.submitted > 0
    ? Math.round((assignment.graded / assignment.submitted) * 100)
    : 0;

  const stats = [
    {
      title: 'Total Students',
      value: String(assignment.totalStudents),
      change: `${assignment.totalStudents - assignment.submitted} not submitted`,
      changeType: 'neutral' as const,
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Submitted',
      value: `${assignment.submitted}/${assignment.totalStudents}`,
      change: `${submissionRate}% submission rate`,
      changeType: submissionRate >= 80 ? 'positive' as const : 'negative' as const,
      icon: CheckCircle,
      iconColor: 'bg-success/10 text-success',
    },
    {
      title: 'Graded',
      value: `${assignment.graded}/${assignment.submitted}`,
      change: `${gradingProgress}% complete`,
      changeType: gradingProgress >= 80 ? 'positive' as const : 'neutral' as const,
      icon: Clock,
      iconColor: 'bg-warning/10 text-warning',
    },
    {
      title: 'Avg. Score',
      value: assignment.graded > 0 ? `${assignment.avgScore}%` : '—',
      change: assignment.graded > 0 ? `Out of ${assignment.maxScore}` : 'No grades yet',
      changeType: 'neutral' as const,
      icon: Award,
      iconColor: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-auto bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/lecturer/assignments" className="hover:text-primary transition-colors">
            Assignments
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-card-foreground font-medium">{assignment.title}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-card-foreground">{assignment.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{assignment.classCode} - {assignment.className}</span>
              <span>•</span>
              <span>{assignment.type}</span>
              <span>•</span>
              <span>Due: {assignment.dueDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/lecturer/assignments"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors duration-150 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 text-sm cursor-pointer">
              <Settings className="w-4 h-4" />
              Edit
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors duration-150 text-sm cursor-pointer">
              <Trash2 className="w-4 h-4" />
              Delete
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

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Submission Rate</span>
              <span className="text-sm font-semibold text-card-foreground">{submissionRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${submissionRate}%` }} />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Grading Progress</span>
              <span className="text-sm font-semibold text-card-foreground">{gradingProgress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success transition-all duration-300" style={{ width: `${gradingProgress}%` }} />
            </div>
          </div>
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

        {/* Submissions Tab */}
        {activeTab === 'Submissions' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Submitted</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Score</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  const sConfig = submissionStatusConfig[sub.status];
                  return (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {sub.studentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-sm text-card-foreground">{sub.studentName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{sub.studentId}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {sub.submittedDate || '—'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-card-foreground">
                          {sub.score !== null ? `${sub.score}/${assignment.maxScore}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sConfig.bgColor} ${sConfig.color}`}>
                          {sConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {sub.status === 'pending' && (
                          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                            Grade
                          </button>
                        )}
                        {sub.status === 'graded' && (
                          <button className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'Settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Assignment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="text-sm text-card-foreground mt-1">{assignment.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Type</label>
                    <p className="text-sm font-medium text-card-foreground mt-1">{assignment.type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Created</label>
                    <p className="text-sm font-medium text-card-foreground mt-1">{assignment.createdAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium text-card-foreground">{assignment.dueDate}</p>
                  </div>
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Max Score</p>
                    <p className="text-sm font-medium text-card-foreground">{assignment.maxScore} points</p>
                  </div>
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Late Submission</p>
                    <p className="text-sm font-medium text-card-foreground">{assignment.allowLate ? 'Allowed' : 'Not allowed'}</p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            {assignment.instructions && (
              <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Instructions</h3>
                <p className="text-sm text-card-foreground whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
