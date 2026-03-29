'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import {
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
} from 'lucide-react';

const allAssignments = [
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
  {
    id: '4',
    title: 'Quiz: Bone Density Assessment',
    className: 'ORTH-301',
    dueDate: 'Mar 15, 2026',
    totalStudents: 68,
    submitted: 0,
    graded: 0,
    status: 'active' as const,
  },
  {
    id: '5',
    title: 'Lab Report: MRI Analysis of Joint Diseases',
    className: 'RAD-205',
    dueDate: 'Mar 20, 2026',
    totalStudents: 72,
    submitted: 12,
    graded: 0,
    status: 'active' as const,
  },
  {
    id: '6',
    title: 'Case Study: Pediatric Bone Fractures',
    className: 'CLIN-401',
    dueDate: 'Feb 10, 2026',
    totalStudents: 44,
    submitted: 44,
    graded: 44,
    status: 'completed' as const,
  },
  {
    id: '7',
    title: 'Midterm: Orthopedic Imaging Fundamentals',
    className: 'ORTH-301',
    dueDate: 'Feb 14, 2026',
    totalStudents: 68,
    submitted: 67,
    graded: 67,
    status: 'completed' as const,
  },
  {
    id: '8',
    title: 'Lab Report: X-ray Interpretation Basics',
    className: 'RAD-205',
    dueDate: 'Feb 28, 2026',
    totalStudents: 72,
    submitted: 72,
    graded: 72,
    status: 'completed' as const,
  },
];

const assignmentStats = [
  {
    title: 'Total Assignments',
    value: '8',
    change: 'This semester',
    changeType: 'neutral' as const,
    icon: ClipboardList,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Active',
    value: '4',
    change: 'Require attention',
    changeType: 'neutral' as const,
    icon: Clock,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Overdue',
    value: '1',
    change: 'Needs follow-up',
    changeType: 'negative' as const,
    icon: AlertCircle,
    iconColor: 'bg-destructive/10 text-destructive',
  },
  {
    title: 'Completed',
    value: '3',
    change: 'All graded',
    changeType: 'positive' as const,
    icon: CheckCircle,
    iconColor: 'bg-success/10 text-success',
  },
];

const statusFilters = ['all', 'active', 'overdue', 'completed'] as const;

export default function LecturerAssignmentsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = allAssignments.filter((a) => {
    const matchesFilter = activeFilter === 'all' || a.status === activeFilter;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <Header
        title="Assignments"
        subtitle="Create, manage, and grade assignments across all classes"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {assignmentStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors duration-150 cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
              />
            </div>
            <Link
              href="/lecturer/assignments/create"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">New Assignment</span>
            </Link>
          </div>
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} {...assignment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">
              No assignments found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
