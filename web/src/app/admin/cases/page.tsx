'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  FileText,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  ShieldAlert,
  ImageOff,
  BarChart3,
} from 'lucide-react';

type CaseStatus = 'approved' | 'pending' | 'hidden' | 'rejected';
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
  usageCount: number;
  imageAnonymized: boolean;
  flagReason?: string;
}

const initialCases: Case[] = [
  { id: '1', title: 'Distal Radius Fracture - Case Study', boneLocation: 'Wrist', lesionType: 'Fracture', difficulty: 'basic', status: 'approved', addedBy: 'Dr. Nguyen Minh', addedDate: '2025-08-15', viewCount: 342, usageCount: 128, imageAnonymized: true },
  { id: '2', title: 'Osteoarthritis of the Knee Joint', boneLocation: 'Knee', lesionType: 'Degenerative', difficulty: 'intermediate', status: 'approved', addedBy: 'Dr. Tran Hoang', addedDate: '2025-08-20', viewCount: 287, usageCount: 95, imageAnonymized: true },
  { id: '3', title: 'Complex Tibial Plateau Fracture', boneLocation: 'Tibia', lesionType: 'Fracture', difficulty: 'advanced', status: 'pending', addedBy: 'Dr. Le Thanh', addedDate: '2025-09-01', viewCount: 0, usageCount: 0, imageAnonymized: true },
  { id: '4', title: 'Shoulder Dislocation Analysis', boneLocation: 'Shoulder', lesionType: 'Dislocation', difficulty: 'intermediate', status: 'approved', addedBy: 'Dr. Pham Expert', addedDate: '2025-07-10', viewCount: 198, usageCount: 72, imageAnonymized: true },
  { id: '5', title: 'Lumbar Spine Compression Fracture', boneLocation: 'Spine', lesionType: 'Fracture', difficulty: 'advanced', status: 'hidden', addedBy: 'Dr. Nguyen Minh', addedDate: '2025-09-05', viewCount: 56, usageCount: 12, imageAnonymized: false, flagReason: 'Patient name visible in DICOM metadata' },
  { id: '6', title: 'Osteosarcoma of the Distal Femur', boneLocation: 'Femur', lesionType: 'Tumor', difficulty: 'advanced', status: 'approved', addedBy: 'Dr. Hoang Expert', addedDate: '2025-06-22', viewCount: 412, usageCount: 156, imageAnonymized: true },
  { id: '7', title: 'Hip Osteoarthritis - Preoperative Planning', boneLocation: 'Hip', lesionType: 'Degenerative', difficulty: 'intermediate', status: 'rejected', addedBy: 'Dr. Tran Hoang', addedDate: '2025-09-10', viewCount: 0, usageCount: 0, imageAnonymized: true, flagReason: 'Incorrect diagnosis labeling' },
  { id: '8', title: 'Clavicle Midshaft Fracture', boneLocation: 'Clavicle', lesionType: 'Fracture', difficulty: 'basic', status: 'approved', addedBy: 'Dr. Le Thanh', addedDate: '2025-07-28', viewCount: 156, usageCount: 68, imageAnonymized: true },
  { id: '9', title: 'Pelvic Ring Fracture - Trauma Case', boneLocation: 'Pelvis', lesionType: 'Fracture', difficulty: 'advanced', status: 'pending', addedBy: 'Dr. Pham Expert', addedDate: '2025-09-18', viewCount: 0, usageCount: 0, imageAnonymized: true },
  { id: '10', title: 'Elbow Dislocation with Radial Head Fracture', boneLocation: 'Elbow', lesionType: 'Dislocation', difficulty: 'intermediate', status: 'hidden', addedBy: 'Dr. Nguyen Minh', addedDate: '2025-08-30', viewCount: 89, usageCount: 34, imageAnonymized: false, flagReason: 'Hospital watermark not removed from images' },
  { id: '11', title: 'Scaphoid Fracture - Occult Detection', boneLocation: 'Wrist', lesionType: 'Fracture', difficulty: 'intermediate', status: 'approved', addedBy: 'Dr. Hoang Expert', addedDate: '2025-07-15', viewCount: 223, usageCount: 89, imageAnonymized: true },
  { id: '12', title: 'Spinal Metastasis - Multi-level', boneLocation: 'Spine', lesionType: 'Tumor', difficulty: 'advanced', status: 'pending', addedBy: 'Dr. Tran Hoang', addedDate: '2025-09-22', viewCount: 0, usageCount: 0, imageAnonymized: true },
];

const statusConfig: Record<CaseStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  hidden: { icon: EyeOff, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Hidden' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
};

const difficultyConfig: Record<Difficulty, { color: string; label: string }> = {
  basic: { color: 'bg-success/10 text-success', label: 'Basic' },
  intermediate: { color: 'bg-warning/10 text-warning', label: 'Intermediate' },
  advanced: { color: 'bg-destructive/10 text-destructive', label: 'Advanced' },
};

const allStatuses: CaseStatus[] = ['approved', 'pending', 'hidden', 'rejected'];

export default function AdminCasesPage() {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ caseItem: Case; action: 'approve' | 'hide' | 'delete' } | null>(null);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.boneLocation.toLowerCase().includes(search.toLowerCase()) ||
        c.lesionType.toLowerCase().includes(search.toLowerCase()) ||
        c.addedBy.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      const matchDifficulty = filterDifficulty === 'All' || c.difficulty === filterDifficulty;
      return matchSearch && matchStatus && matchDifficulty;
    });
  }, [cases, search, filterStatus, filterDifficulty]);

  const stats = useMemo(() => ({
    approved: cases.filter((c) => c.status === 'approved').length,
    pending: cases.filter((c) => c.status === 'pending').length,
    hidden: cases.filter((c) => c.status === 'hidden').length,
    rejected: cases.filter((c) => c.status === 'rejected').length,
    privacyIssues: cases.filter((c) => !c.imageAnonymized).length,
  }), [cases]);

  const handleAction = useCallback((caseItem: Case, action: 'approve' | 'hide' | 'delete') => {
    setDialog({ caseItem, action });
  }, []);

  const confirmAction = useCallback(() => {
    if (!dialog) return;
    const { caseItem, action } = dialog;
    if (action === 'delete') {
      setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
    } else if (action === 'approve') {
      setCases((prev) => prev.map((c) => c.id === caseItem.id ? { ...c, status: 'approved' as CaseStatus } : c));
    } else if (action === 'hide') {
      setCases((prev) => prev.map((c) => c.id === caseItem.id ? { ...c, status: 'hidden' as CaseStatus } : c));
    }
    setDialog(null);
  }, [dialog]);

  return (
    <div className="min-h-screen">
      <Header title="Case Management" subtitle={`${cases.length} cases total`} />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {allStatuses.map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'All' : status)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  filterStatus === status
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-input/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-card-foreground">{stats[status]}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </button>
            );
          })}
          {/* Privacy issues card */}
          <button
            onClick={() => setSearch('anonymized')}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
              stats.privacyIssues > 0
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className={`w-5 h-5 ${stats.privacyIssues > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-card-foreground">{stats.privacyIssues}</p>
              <p className="text-xs text-muted-foreground">Privacy Issues</p>
            </div>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, location, type, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CaseStatus | 'All')}
                className="h-10 pl-10 pr-8 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="hidden">Hidden</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'All')}
              className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="All">All Difficulty</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium text-card-foreground">No cases found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Case</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Location / Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Difficulty</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Privacy</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Stats</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => {
                    const stConfig = statusConfig[c.status];
                    const StIcon = stConfig.icon;
                    const dConfig = difficultyConfig[c.difficulty];
                    const isExpanded = expandedCase === c.id;

                    return (
                      <tr key={c.id} className="group hover:bg-input/30 transition-colors duration-150">
                        {/* Case Info */}
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setExpandedCase(isExpanded ? null : c.id)}
                            className="flex items-start gap-2 text-left cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div>
                              <Link href={`/admin/cases/${c.id}`} className="text-sm font-medium text-card-foreground leading-snug hover:text-primary transition-colors">
                                {c.title}
                              </Link>
                              {isExpanded && (
                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                  <p>Added by: <span className="text-card-foreground">{c.addedBy}</span></p>
                                  <p>Date: <span className="text-card-foreground">{c.addedDate}</span></p>
                                  {c.flagReason && (
                                    <div className="flex items-start gap-1.5 mt-1.5 px-2.5 py-2 rounded-md bg-destructive/10 border border-destructive/20">
                                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                                      <span className="text-destructive">{c.flagReason}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* Location / Type */}
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{c.boneLocation}</span>
                            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">{c.lesionType}</span>
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${dConfig.color}`}>
                            {dConfig.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${stConfig.bg} ${stConfig.color}`}>
                            <StIcon className="w-3.5 h-3.5" />
                            {stConfig.label}
                          </span>
                        </td>

                        {/* Privacy */}
                        <td className="px-5 py-3">
                          {c.imageAnonymized ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                              <CheckCircle className="w-3.5 h-3.5" />
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                              <ImageOff className="w-3.5 h-3.5" />
                              Issue
                            </span>
                          )}
                        </td>

                        {/* Stats */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {c.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3.5 h-3.5" />
                              {c.usageCount}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve (show for pending, hidden, rejected) */}
                            {c.status !== 'approved' && (
                              <button
                                onClick={() => handleAction(c, 'approve')}
                                title="Approve case"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-success/10 cursor-pointer transition-colors"
                              >
                                <CheckCircle className="w-4 h-4 text-success" />
                              </button>
                            )}
                            {/* Hide (show for approved, pending) */}
                            {(c.status === 'approved' || c.status === 'pending') && (
                              <button
                                onClick={() => handleAction(c, 'hide')}
                                title="Hide case from students"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-warning/10 cursor-pointer transition-colors"
                              >
                                <EyeOff className="w-4 h-4 text-warning" />
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              onClick={() => handleAction(c, 'delete')}
                              title="Delete case"
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {dialog && (
        <CaseActionDialog
          caseItem={dialog.caseItem}
          action={dialog.action}
          onConfirm={confirmAction}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function CaseActionDialog({
  caseItem,
  action,
  onConfirm,
  onCancel,
}: {
  caseItem: Case;
  action: 'approve' | 'hide' | 'delete';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = {
    approve: {
      icon: CheckCircle,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      title: 'Approve Case',
      description: <>Approve <strong className="text-card-foreground">{caseItem.title}</strong>? Students will be able to view and study this case.</>,
      buttonText: 'Approve',
      buttonClass: 'bg-success hover:bg-success/90',
      warning: !caseItem.imageAnonymized ? 'This case has privacy issues. Please verify that images are properly anonymized before approving.' : null,
    },
    hide: {
      icon: EyeOff,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      title: 'Hide Case',
      description: <>Hide <strong className="text-card-foreground">{caseItem.title}</strong> from students? The case will remain in the system but won&apos;t be visible to students.</>,
      buttonText: 'Hide Case',
      buttonClass: 'bg-warning hover:bg-warning/90',
      warning: null,
    },
    delete: {
      icon: Trash2,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      title: 'Delete Case',
      description: <>Permanently delete <strong className="text-card-foreground">{caseItem.title}</strong>? This action cannot be undone. All associated data will be removed.</>,
      buttonText: 'Delete',
      buttonClass: 'bg-destructive hover:bg-destructive/90',
      warning: caseItem.usageCount > 0 ? `This case has been used ${caseItem.usageCount} times by students. Deleting it will affect their learning history.` : null,
    },
  }[action];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${config.iconBg}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">{config.description}</p>

        {config.warning && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">{config.warning}</p>
          </div>
        )}

        {/* Case info */}
        <div className="px-4 py-3 rounded-lg bg-input/50 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">{caseItem.boneLocation}</span>
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">{caseItem.lesionType}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyConfig[caseItem.difficulty].color}`}>
              {difficultyConfig[caseItem.difficulty].label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            By {caseItem.addedBy} &middot; {caseItem.viewCount} views &middot; {caseItem.usageCount} uses
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors ${config.buttonClass}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
