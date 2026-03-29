'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  FolderOpen, Search, Plus, CheckCircle, Clock, AlertTriangle, Eye,
  Edit, Trash2, X, ChevronDown, ChevronRight, MapPin, Crosshair, BarChart3,
} from 'lucide-react';

type CaseStatus = 'approved' | 'pending' | 'draft';
type Difficulty = 'basic' | 'intermediate' | 'advanced';

interface Case {
  id: string;
  title: string;
  boneLocation: string;
  lesionType: string;
  difficulty: Difficulty;
  status: CaseStatus;
  addedBy: string;
  addedDate: string;
  viewCount: number;
  learningPoints: string[];
  tags: string[];
}

const initialCases: Case[] = [
  { id: '1', title: 'Distal Radius Fracture - Colles Type', boneLocation: 'Wrist', lesionType: 'Fracture', difficulty: 'basic', status: 'approved', addedBy: 'Dr. Pham Expert', addedDate: '2025-08-15', viewCount: 342, learningPoints: ['Identify dorsal angulation', 'AO classification 23-A2', 'FOOSH mechanism'], tags: ['fracture', 'wrist', 'Colles', 'basic'] },
  { id: '2', title: 'Osteoarthritis of the Knee Joint', boneLocation: 'Knee', lesionType: 'Degenerative', difficulty: 'intermediate', status: 'approved', addedBy: 'Dr. Hoang Expert', addedDate: '2025-08-20', viewCount: 287, learningPoints: ['Kellgren-Lawrence grading', 'Joint space narrowing', 'Osteophyte formation'], tags: ['osteoarthritis', 'knee', 'degenerative'] },
  { id: '3', title: 'Complex Tibial Plateau Fracture', boneLocation: 'Tibia', lesionType: 'Fracture', difficulty: 'advanced', status: 'pending', addedBy: 'Dr. Pham Expert', addedDate: '2025-09-01', viewCount: 0, learningPoints: ['Schatzker classification', 'CT assessment', 'Surgical planning'], tags: ['fracture', 'tibia', 'plateau', 'complex'] },
  { id: '4', title: 'Shoulder Dislocation - Anterior Type', boneLocation: 'Shoulder', lesionType: 'Dislocation', difficulty: 'intermediate', status: 'approved', addedBy: 'Dr. Hoang Expert', addedDate: '2025-07-10', viewCount: 198, learningPoints: ['Hill-Sachs lesion', 'Bankart lesion', 'Reduction technique'], tags: ['dislocation', 'shoulder', 'anterior'] },
  { id: '5', title: 'Osteosarcoma of the Distal Femur', boneLocation: 'Femur', lesionType: 'Tumor', difficulty: 'advanced', status: 'approved', addedBy: 'Dr. Pham Expert', addedDate: '2025-06-22', viewCount: 412, learningPoints: ['Sunburst periosteal reaction', 'Codman triangle', 'MRI staging'], tags: ['tumor', 'osteosarcoma', 'femur'] },
  { id: '6', title: 'Scaphoid Fracture - Occult Detection', boneLocation: 'Wrist', lesionType: 'Fracture', difficulty: 'intermediate', status: 'draft', addedBy: 'Dr. Hoang Expert', addedDate: '2026-02-10', viewCount: 0, learningPoints: ['Anatomical snuffbox tenderness', 'MRI for occult fracture', 'Herbert screw fixation'], tags: ['fracture', 'scaphoid', 'wrist', 'occult'] },
  { id: '7', title: 'Pelvic Ring Fracture - Trauma Case', boneLocation: 'Pelvis', lesionType: 'Fracture', difficulty: 'advanced', status: 'pending', addedBy: 'Dr. Pham Expert', addedDate: '2026-01-18', viewCount: 0, learningPoints: ['Young-Burgess classification', 'Hemodynamic instability', 'Pelvic binder'], tags: ['fracture', 'pelvis', 'trauma'] },
  { id: '8', title: 'Clavicle Midshaft Fracture', boneLocation: 'Clavicle', lesionType: 'Fracture', difficulty: 'basic', status: 'approved', addedBy: 'Dr. Hoang Expert', addedDate: '2025-07-28', viewCount: 156, learningPoints: ['Allman classification', 'Non-operative vs operative', 'Neurovascular assessment'], tags: ['fracture', 'clavicle', 'basic'] },
];

const statusConfig: Record<CaseStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  draft: { icon: Edit, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Draft' },
};

const difficultyConfig: Record<Difficulty, { color: string }> = {
  basic: { color: 'bg-success/10 text-success' },
  intermediate: { color: 'bg-warning/10 text-warning' },
  advanced: { color: 'bg-destructive/10 text-destructive' },
};

export default function ExpertCasesPage() {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ c: Case; action: 'approve' | 'delete' } | null>(null);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = c.title.toLowerCase().includes(q) || c.boneLocation.toLowerCase().includes(q) || c.lesionType.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q));
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      const matchDiff = filterDifficulty === 'All' || c.difficulty === filterDifficulty;
      return matchSearch && matchStatus && matchDiff;
    });
  }, [cases, search, filterStatus, filterDifficulty]);

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.action === 'delete') setCases((prev) => prev.filter((c) => c.id !== dialog.c.id));
    else if (dialog.action === 'approve') setCases((prev) => prev.map((c) => c.id === dialog.c.id ? { ...c, status: 'approved' as CaseStatus } : c));
    setDialog(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Case Library" subtitle={`${cases.length} cases`} />
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Actions + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link href="/expert/cases/create" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium">
            <Plus className="w-4 h-4" /> Add New Case
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CaseStatus | 'All')} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
            <option value="All">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="draft">Draft</option>
          </select>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'All')} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
            <option value="All">All Difficulty</option><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Cases Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
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
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{c.boneLocation}</span>
                            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">{c.lesionType}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${df.color}`}>{c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3.5 h-3.5" />{c.viewCount}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                      </div>
                    </div>
                    {isExp && (
                      <div className="mt-3 ml-6 space-y-3">
                        <div className="text-xs text-muted-foreground">By {c.addedBy} &middot; {c.addedDate}</div>
                        <div>
                          <p className="text-xs font-medium text-card-foreground mb-1">Key Learning Points:</p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                            {c.learningPoints.map((lp, i) => <li key={i}>{lp}</li>)}
                          </ul>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.tags.map((tag) => <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{tag}</span>)}
                        </div>
                        <div className="flex items-center gap-2">
                          {c.status !== 'approved' && <button onClick={() => setDialog({ c, action: 'approve' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 cursor-pointer transition-colors"><CheckCircle className="w-3.5 h-3.5" />Approve</button>}
                          <button onClick={() => setDialog({ c, action: 'delete' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDialog(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">{dialog.action === 'approve' ? 'Approve Case' : 'Delete Case'}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">{dialog.action === 'approve' ? <>Mark <strong className="text-card-foreground">{dialog.c.title}</strong> as approved?</> : <>Delete <strong className="text-card-foreground">{dialog.c.title}</strong>? This cannot be undone.</>}</p>
            <div className="flex gap-3">
              <button onClick={() => setDialog(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
              <button onClick={handleConfirm} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors ${dialog.action === 'approve' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}`}>{dialog.action === 'approve' ? 'Approve' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
