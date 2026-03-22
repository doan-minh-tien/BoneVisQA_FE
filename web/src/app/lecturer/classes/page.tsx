'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import ClassCard from '@/components/lecturer/ClassCard';
import {
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Plus,
  Search,
} from 'lucide-react';

// Mock data
const allClasses = [
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
  {
    id: '4',
    name: 'Introduction to Bone Anatomy',
    code: 'ANAT-101',
    cohort: 'Year 1 - Cohort 2026',
    studentCount: 90,
    completionRate: 0,
    nextSession: 'Mar 20, 2026',
    status: 'upcoming' as const,
  },
  {
    id: '5',
    name: 'Pediatric Orthopedics',
    code: 'PEDI-302',
    cohort: 'Year 3 - Cohort 2024',
    studentCount: 55,
    completionRate: 0,
    nextSession: 'Apr 5, 2026',
    status: 'upcoming' as const,
  },
  {
    id: '6',
    name: 'Bone Pathology Fundamentals',
    code: 'PATH-201',
    cohort: 'Year 2 - Cohort 2024',
    studentCount: 65,
    completionRate: 100,
    nextSession: '',
    status: 'completed' as const,
  },
];

const classStats = [
  {
    title: 'Total Classes',
    value: '6',
    change: '3 active this semester',
    changeType: 'neutral' as const,
    icon: BookOpen,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Active Classes',
    value: '3',
    change: 'All on track',
    changeType: 'positive' as const,
    icon: GraduationCap,
    iconColor: 'bg-success/10 text-success',
  },
  {
    title: 'Total Students',
    value: '394',
    change: 'Across all classes',
    changeType: 'neutral' as const,
    icon: Users,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Avg. Completion',
    value: '91%',
    change: '+3% from last month',
    changeType: 'positive' as const,
    icon: TrendingUp,
    iconColor: 'bg-warning/10 text-warning',
  },
];

const statusFilters = ['all', 'active', 'upcoming', 'completed'] as const;

export default function LecturerClassesPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClasses = allClasses.filter((c) => {
    const matchesFilter = activeFilter === 'all' || c.status === activeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <Header
        title="My Classes"
        subtitle="Manage and monitor all your classes"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {classStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Search & Filter Bar */}
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
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">Create Class</span>
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((classItem) => (
              <ClassCard key={classItem.id} {...classItem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">
              No classes found
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
