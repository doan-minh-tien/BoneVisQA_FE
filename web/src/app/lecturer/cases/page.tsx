'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  FolderOpen,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Plus,
} from 'lucide-react';
import {
  getLecturerCases,
  getLecturerClasses,
  approveCase,
  type CaseDto,
  type ClassItem,
} from '@/lib/api';
import AssignCasesDialog from '@/components/lecturer/cases/AssignCasesDialog';
import CasesTable from '@/components/lecturer/cases/CasesTable';

type StatusFilter = 'all' | 'approved' | 'unapproved' | 'active' | 'inactive';

export default function LecturerCasesPage() {
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Assign dialog
  const [showAssign, setShowAssign] = useState(false);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [assignClassId, setAssignClassId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token') || '';
        const userId = localStorage.getItem('userId') || '';
        const [casesData, classesData] = await Promise.all([
          getLecturerCases(token),
          getLecturerClasses(userId, token),
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

  const handleToggleApprove = async (c: CaseDto) => {
    setTogglingIds((prev) => new Set(prev).add(c.id));
    try {
      const token = localStorage.getItem('token') || '';
      await approveCase(c.id, !c.isApproved, token);
      setCases((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, isApproved: !item.isApproved } : item)),
      );
    } catch {
      // silently fail
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }
  };

  // We removed handleAssign here as it is moved to AssignCasesDialog.
  // We just need a way to close dialog and clear states.
  const handleAssignSuccess = () => {
    setShowAssign(false);
    setSelectedCases(new Set());
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

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{cases.length}</p>
              <p className="text-sm text-muted-foreground">Total Cases</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{cases.length - approvedCount}</p>
              <p className="text-sm text-muted-foreground">Unapproved</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'approved', 'unapproved', 'active', 'inactive'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === f
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
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
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            {selectedCases.size > 0 && (
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Assign to Class ({selectedCases.size})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading cases...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
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
              onToggleApprove={handleToggleApprove}
              togglingIds={togglingIds}
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
