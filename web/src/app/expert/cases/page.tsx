'use client';

import { useEffect, useMemo, useState } from 'react';
import ExpertHeader from '@/components/expert/ExpertHeader';
import {
  FolderOpen, Search, Plus, CheckCircle, Clock, Eye,
  Edit, Trash2, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import {
  approveExpertCase,
  createExpertCase,
  deleteExpertCase,
  fetchExpertCasesPaged,
  fetchExpertCategories,
  updateExpertCase,
  type CaseDifficulty as Difficulty,
  type CaseStatus,
  type ExpertCase as Case,
  type ExpertCategory,
} from '@/lib/api/expert-cases';
import { getStoredUserId } from '@/lib/getStoredUserId';
import { useToast } from '@/components/ui/toast';
import CaseAssetsDialog from '@/components/expert/cases/CaseAssetsDialog';

const statusConfig: Record<CaseStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  rejected: { icon: Edit, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Rejected' },
};

const difficultyConfig: Record<Difficulty, { color: string }> = {
  Easy: { color: 'bg-success/10 text-success' },
  Medium: { color: 'bg-warning/10 text-warning' },
  Hard: { color: 'bg-destructive/10 text-destructive' },
};

export default function ExpertCasesPage() {
  const toast = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [categories, setCategories] = useState<ExpertCategory[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ c: Case; action: 'approve' | 'delete' } | null>(null);
  const [assetsDialog, setAssetsDialog] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    isApproved: false,
    isActive: true,
    suggestedDiagnosis: '',
    reflectiveQuestions: '',
    keyFindings: '',
  });

  const categoryOptions = categories;

  const loadCases = async (page = pageIndex) => {
    try {
      setIsLoading(true);
      const res = await fetchExpertCasesPaged(page, pageSize);
      setCases(res.items);
      setTotalCount(res.totalCount);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cases.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [casesRes, cats] = await Promise.all([
          fetchExpertCasesPaged(pageIndex, pageSize),
          fetchExpertCategories(),
        ]);
        if (!cancelled) {
          setCases(casesRes.items);
          setTotalCount(casesRes.totalCount);
          setCategories(cats);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load cases or categories.';
        setError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageIndex, toast]);

  const openCreateForm = () => {
    setEditingCase(null);
    setForm({
      title: '',
      categoryId: '',
      description: '',
      difficulty: 'Easy',
      isApproved: false,
      isActive: true,
      suggestedDiagnosis: '',
      reflectiveQuestions: '',
      keyFindings: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (c: Case) => {
    setEditingCase(c);
    setForm({
      title: c.title,
      categoryId: c.categoryId,
      description: c.description,
      difficulty: c.difficulty,
      isApproved: c.isApproved,
      isActive: c.isActive,
      suggestedDiagnosis: c.suggestedDiagnosis,
      reflectiveQuestions: c.reflectiveQuestions,
      keyFindings: c.keyFindings,
    });
    setIsFormOpen(true);
  };

  const handleSaveCase = async () => {
    const createdByExpertId = editingCase?.createdByExpertId || getStoredUserId();
    if (!form.title.trim() || !form.categoryId.trim() || !createdByExpertId) {
      toast.error('Title, category, and userId are required.');
      return;
    }
    setIsMutating(true);
    try {
      const payload = {
        title: form.title.trim(),
        createdByExpertId,
        description: form.description.trim(),
        difficulty: form.difficulty,
        isApproved: form.isApproved,
        isActive: form.isActive,
        categoryId: form.categoryId.trim(),
        suggestedDiagnosis: form.suggestedDiagnosis.trim(),
        reflectiveQuestions: form.reflectiveQuestions.trim(),
        keyFindings: form.keyFindings.trim(),
      };
      if (editingCase) {
        await updateExpertCase(editingCase.id, payload);
        toast.success('Case updated successfully.');
        await loadCases(pageIndex);
      } else {
        await createExpertCase(payload);
        toast.success('Case created successfully.');
        setPageIndex(1);
        await loadCases(1);
      }
      setIsFormOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed.';
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  };

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.title.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      const matchDiff = filterDifficulty === 'All' || c.difficulty === filterDifficulty;
      return matchSearch && matchStatus && matchDiff;
    });
  }, [cases, search, filterStatus, filterDifficulty]);

  const handleConfirm = async () => {
    if (!dialog) return;
    const selected = dialog;
    setDialog(null);
    setIsMutating(true);
    try {
      if (selected.action === 'delete') {
        await deleteExpertCase(selected.c.id);
        setCases((prev) => prev.filter((c) => c.id !== selected.c.id));
        toast.success('Case deleted successfully.');
      } else {
        const updated = await approveExpertCase(selected.c.id);
        setCases((prev) => prev.map((c) => (c.id === selected.c.id ? updated : c)));
        toast.success('Case approved successfully.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed.';
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <ExpertHeader title="Case Library" subtitle={`${cases.length} cases`} />
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Actions + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium">
            <Plus className="w-4 h-4" /> Add New Case
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CaseStatus | 'All')} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
            <option value="All">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
          </select>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'All')} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
            <option value="All">All Difficulty</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
          </select>
        </div>

        {/* Cases Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-lg font-medium text-card-foreground">Loading cases...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-lg font-medium text-destructive">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center"><FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-lg font-medium text-card-foreground">No cases found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((c) => {
                const st = statusConfig[c.status];
                const StIcon = st.icon;
                const df = difficultyConfig[c.difficulty];
                const isExp = expandedCase === c.id;
                return (
                  <div key={c.id} className="px-5 py-4 hover:bg-input/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => setExpandedCase(isExp ? null : c.id)} className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0">
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">{c.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{c.categoryName}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${df.color}`}>{c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3.5 h-3.5" />-</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                      </div>
                    </div>
                    {isExp && (
                      <div className="mt-3 ml-6 space-y-3">
                        <div className="text-xs text-muted-foreground">By {c.addedBy} &middot; {c.addedDate}</div>
                        <div>
                          <p className="text-xs font-medium text-card-foreground mb-1">Description:</p>
                          <p className="text-xs text-muted-foreground">{c.description || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-card-foreground mb-1">Key Findings:</p>
                          <p className="text-xs text-muted-foreground">{c.keyFindings || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-card-foreground mb-1">Suggested Diagnosis:</p>
                          <p className="text-xs text-muted-foreground">{c.suggestedDiagnosis || '-'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button disabled={isMutating} onClick={() => setAssetsDialog(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs font-medium hover:bg-info/20 disabled:opacity-50 cursor-pointer transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100">Media & Tags</button>
                          <button disabled={isMutating} onClick={() => openEditForm(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 cursor-pointer transition-colors"><Edit className="w-3.5 h-3.5" />Edit</button>
                          {c.status !== 'approved' && <button disabled={isMutating} onClick={() => setDialog({ c, action: 'approve' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 disabled:opacity-50 cursor-pointer transition-colors"><CheckCircle className="w-3.5 h-3.5" />Approve</button>}
                          <button disabled={isMutating} onClick={() => setDialog({ c, action: 'delete' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-card">
              <span className="text-sm text-muted-foreground">
                Showing {(pageIndex - 1) * pageSize + 1} to {Math.min(pageIndex * pageSize, totalCount)} of {totalCount} entries
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pageIndex === 1 || isLoading}
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-border rounded text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={pageIndex * pageSize >= totalCount || isLoading}
                  onClick={() => setPageIndex((p) => p + 1)}
                  className="px-3 py-1.5 border border-border rounded text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDialog(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">{dialog.action === 'approve' ? 'Approve Case' : 'Delete Case'}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">{dialog.action === 'approve' ? <>Mark <strong className="text-card-foreground">{dialog.c.title}</strong> as approved?</> : <>Delete <strong className="text-card-foreground">{dialog.c.title}</strong>? This cannot be undone.</>}</p>
            <div className="flex gap-3">
              <button onClick={() => setDialog(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
              <button disabled={isMutating} onClick={handleConfirm} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors disabled:opacity-50 ${dialog.action === 'approve' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}>{dialog.action === 'approve' ? 'Approve' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      {assetsDialog && (
        <CaseAssetsDialog
          caseId={assetsDialog.id}
          onClose={() => setAssetsDialog(null)}
        />
      )}
      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              {editingCase ? 'Edit Medical Case' : 'Create Medical Case'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2 rounded-lg border border-border bg-input text-sm" />
              <select
                value={form.categoryId}
                onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm"
              >
                <option value="">Select category</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              {categoryOptions.length === 0 && (
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  No categories available. Please add categories in the category management section first.
                </p>
              )}
              <select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))} className="px-3 py-2 rounded-lg border border-border bg-input text-sm">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isApproved} onChange={(e) => setForm((p) => ({ ...p, isApproved: e.target.checked }))} />
                Approved
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Active
              </label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-input text-sm min-h-20" />
              <textarea value={form.keyFindings} onChange={(e) => setForm((p) => ({ ...p, keyFindings: e.target.value }))} placeholder="Key findings" className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-input text-sm min-h-20" />
              <textarea value={form.suggestedDiagnosis} onChange={(e) => setForm((p) => ({ ...p, suggestedDiagnosis: e.target.value }))} placeholder="Suggested diagnosis" className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-input text-sm min-h-20" />
              <textarea value={form.reflectiveQuestions} onChange={(e) => setForm((p) => ({ ...p, reflectiveQuestions: e.target.value }))} placeholder="Reflective questions" className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-input text-sm min-h-20" />
            </div>
            <div className="flex gap-3 mt-5">
              <button disabled={isMutating} onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50">Cancel</button>
              <button disabled={isMutating} onClick={handleSaveCase} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50">
                {editingCase ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
