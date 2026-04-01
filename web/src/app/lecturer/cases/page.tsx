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
  ShieldCheck,
  ShieldOff,
  Plus,
  X,
} from 'lucide-react';
import {
  getLecturerCases,
  getLecturerClasses,
  approveCase,
  assignCasesToClass,
} from '@/lib/api/lecturer';
import type { CaseDto, ClassItem } from '@/lib/api/types';

type StatusFilter = 'all' | 'approved' | 'unapproved' | 'active' | 'inactive';

const difficultyColors: Record<string, string> = {
  easy: 'bg-success/10 text-success',
  basic: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  intermediate: 'bg-warning/10 text-warning',
  hard: 'bg-destructive/10 text-destructive',
  advanced: 'bg-destructive/10 text-destructive',
};

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

  const handleToggleApprove = async (c: CaseDto) => {
    setTogglingIds((prev) => new Set(prev).add(c.id));
    try {
      await approveCase(c.id, !c.isApproved);
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

  const handleAssign = async () => {
    if (!assignClassId || selectedCases.size === 0) {
      setAssignError('Please select a class and at least one case.');
      return;
    }
    setAssigning(true);
    setAssignError('');
    try {
      await assignCasesToClass(assignClassId, {
        caseIds: Array.from(selectedCases),
        isMandatory: true,
      });
      setShowAssign(false);
      setSelectedCases(new Set());
      setAssignClassId('');
    } catch {
      setAssignError('Failed to assign cases. Please try again.');
    } finally {
      setAssigning(false);
    }
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
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCases.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selectedCases.size === filtered.length) {
                          setSelectedCases(new Set());
                        } else {
                          setSelectedCases(new Set(filtered.map((c) => c.id)));
                        }
                      }}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Title
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Category
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Difficulty
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Status
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Approved
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Created
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const isToggling = togglingIds.has(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCases.has(c.id)}
                          onChange={() => toggleCaseSelection(c.id)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-card-foreground">
                          {c.title || 'Untitled'}
                        </p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {c.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {c.categoryName ? (
                          <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded font-medium">
                            {c.categoryName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {c.difficulty ? (
                          <span
                            className={`px-2.5 py-1 text-xs rounded font-medium ${
                              difficultyColors[c.difficulty.toLowerCase()] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            c.isActive ? 'text-success' : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.isActive ? 'bg-success' : 'bg-muted-foreground'
                            }`}
                          />
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {c.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                            <ShieldOff className="w-3.5 h-3.5" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleToggleApprove(c)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            c.isApproved
                              ? 'text-warning hover:bg-warning/10'
                              : 'text-success hover:bg-success/10'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : c.isApproved ? (
                            <ShieldOff className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {isToggling ? '...' : c.isApproved ? 'Unapprove' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign to Class Dialog */}
      {showAssign && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssign(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Assign Cases to Class</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCases.size} case(s) selected
                </p>
              </div>
              <button
                onClick={() => setShowAssign(false)}
                className="w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {assignError && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {assignError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                Select Class
              </label>
              <select
                value={assignClassId}
                onChange={(e) => setAssignClassId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className} — {cls.semester}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssign(false);
                  setAssignError('');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
