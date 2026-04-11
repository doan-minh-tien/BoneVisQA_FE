'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import AssignmentCard from '@/components/lecturer/AssignmentCard';
import { useToast } from '@/components/ui/toast';
import { getAllLecturerAssignments } from '@/lib/api/lecturer';
import type { ClassAssignment } from '@/lib/api/types';
import {
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';

const statusFilters = ['all', 'active', 'overdue', 'completed'] as const;
type StatusFilter = (typeof statusFilters)[number];

function computeStatus(
  dueDate: string | null | undefined,
  submitted: number,
  total: number,
): 'active' | 'overdue' | 'completed' {
  if (submitted > 0 && submitted >= total && total > 0) return 'completed';
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
  return 'active';
}

export default function LecturerAssignmentsPage() {
  const toast = useToast();
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssignments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssignments.map((a) => a.id)));
    }
  };

  const deleteSelected = () => {
    setAssignments((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  useEffect(() => {
    let cancelled = false;
    const userId =
      typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getAllLecturerAssignments(userId);
        if (!cancelled) setAssignments(data);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load assignments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const stats = useMemo(() => {
    const active = assignments.filter(
      (a) => computeStatus(a.dueDate, a.submittedCount, a.totalStudents) === 'active',
    ).length;
    const overdue = assignments.filter(
      (a) => computeStatus(a.dueDate, a.submittedCount, a.totalStudents) === 'overdue',
    ).length;
    const completed = assignments.filter(
      (a) => computeStatus(a.dueDate, a.submittedCount, a.totalStudents) === 'completed',
    ).length;
    return [
      {
        title: 'Total Assignments',
        value: String(assignments.length),
        change: 'This semester',
        changeType: 'neutral' as const,
        icon: ClipboardList,
        iconColor: 'bg-primary/10 text-primary',
      },
      {
        title: 'Active',
        value: String(active),
        change: active > 0 ? 'Require attention' : 'No active assignments',
        changeType: 'neutral' as const,
        icon: Clock,
        iconColor: 'bg-accent/10 text-accent',
      },
      {
        title: 'Overdue',
        value: String(overdue),
        change: overdue > 0 ? 'Needs follow-up' : 'No overdue',
        changeType: overdue > 0 ? ('negative' as const) : ('positive' as const),
        icon: AlertCircle,
        iconColor: 'bg-destructive/10 text-destructive',
      },
      {
        title: 'Completed',
        value: String(completed),
        change: completed > 0 ? 'All graded' : 'No completed yet',
        changeType: 'positive' as const,
        icon: CheckCircle,
        iconColor: 'bg-success/10 text-success',
      },
    ];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const status = computeStatus(a.dueDate, a.submittedCount, a.totalStudents);
      const matchesFilter = activeFilter === 'all' || status === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q) ||
        (a.type ?? '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [assignments, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen">
      <Header
        title="Assignments"
        subtitle="Create, manage, and grade assignments across all classes"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading
            ? stats.map((s) => (
                <div
                  key={s.title}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            : stats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectMode(!selectMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors duration-150 cursor-pointer ${
                selectMode
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Multi Select
            </button>
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
            {selectMode && selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-150 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </button>
            )}
            {selectMode && filteredAssignments.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-150 cursor-pointer"
              >
                {selectedIds.size === filteredAssignments.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                Select All
              </button>
            )}
          </div>
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">New Assignment</span>
          </Link>
        </div>

        {/* Assignments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">
              {assignments.length === 0 ? 'No assignments yet' : 'No assignments match your filter'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {assignments.length === 0
                ? 'Create a new assignment from a class detail page.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((a) => (
              <AssignmentCard
                key={a.id}
                {...a}
                submitted={a.submittedCount}
                graded={a.gradedCount}
                selectable={selectMode}
                selected={selectedIds.has(a.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
