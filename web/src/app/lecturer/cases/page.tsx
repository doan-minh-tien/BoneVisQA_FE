'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { LecturerCasesPageSkeleton } from '@/components/shared/DashboardSkeletons';
import AssignCasesDialog from '@/components/lecturer/cases/AssignCasesDialog';
import CasesTable from '@/components/lecturer/cases/CasesTable';
import {
  FolderOpen,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
} from 'lucide-react';
import {
  getLecturerCases,
  getLecturerClasses,
} from '@/lib/api/lecturer';
import { useToast } from '@/components/ui/toast';
import type { CaseDto, ClassItem, ClassCaseAssignmentDto } from '@/lib/api/types';

type StatusFilter = 'all' | 'approved' | 'unapproved' | 'active' | 'inactive';

export default function LecturerCasesPage() {
  const router = useRouter();
  const toast = useToast();
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Assign dialog
  const [showAssign, setShowAssign] = useState(false);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = localStorage.getItem('userId') || '';
        const [casesData, classesData] = await Promise.all([
          getLecturerCases(),
          getLecturerClasses(userId),
        ]);
        setCases(casesData);
        setClasses(classesData);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAssignSuccess = (assignments: ClassCaseAssignmentDto[]) => {
    setShowAssign(false);
    setSelectedCases(new Set());

    // Save composite keys (classId_caseId) for highlight on Assignments page
    const newKeys = assignments.map(a => `${a.classId}_${a.caseId}`);
    sessionStorage.setItem('newAssignmentIds', JSON.stringify(newKeys));

    toast.success('Cases assigned successfully!', {
      action: {
        label: 'View',
        onClick: () => router.push(`/lecturer/assignments?new=${newKeys.join(',')}`)
      }
    });
  };

  const toggleCaseSelection = (id: string) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.title?.toLowerCase().includes(q) ?? false) ||
      (c.categoryName?.toLowerCase().includes(q) ?? false) ||
      (c.difficulty?.toLowerCase().includes(q) ?? false);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && c.isApproved) ||
      (statusFilter === 'unapproved' && !c.isApproved) ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);
    return matchSearch && matchStatus;
  });

  const approvedCount = cases.filter((c) => c.isApproved).length;
  const activeCount = cases.filter((c) => c.isActive).length;

  return (
    <div className="min-h-screen">
      <Header title="Cases" subtitle={`${cases.length} cases total`} />

      <div className="mx-auto max-w-[1200px] p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{cases.length}</p>
              <p className="text-sm text-muted-foreground">Total Cases</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{cases.length - approvedCount}</p>
              <p className="text-sm text-muted-foreground">Unapproved</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1">
            {(['all', 'approved', 'unapproved', 'active', 'inactive'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                  statusFilter === f
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {selectedCases.size > 0 && (
              <button
                onClick={() => setShowAssign(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Assign to Class ({selectedCases.size})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LecturerCasesPageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">No cases found</h3>
            <p className="text-sm text-muted-foreground">
              {cases.length === 0 ? 'No cases available.' : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
            <CasesTable
              cases={filtered}
              selectedCases={selectedCases}
              onSelectAll={setSelectedCases}
              onSelect={toggleCaseSelection}
            />
        )}
      </div>

      {/* Assign to Class Dialog */}
      {showAssign && (
        <AssignCasesDialog
          onClose={() => setShowAssign(false)}
          onSuccess={handleAssignSuccess}
          selectedCases={selectedCases}
          classes={classes}
        />
      )}
    </div>
  );
}
