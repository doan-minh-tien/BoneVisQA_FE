'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  FileText,
  Search,
  Filter,
  Upload,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  Eye,
  Tags,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Trash2,
  X,
  Edit,
} from 'lucide-react';

type DocStatus = 'active' | 'draft' | 'outdated' | 'archived';

interface Document {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  status: DocStatus;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  retrievalCount: number;
  lastIndexed: string;
  fileSize: string;
  fileType: string;
}

const initialDocuments: Document[] = [
  {
    id: '1', title: 'Fracture Classification Systems - AO/OTA Guidelines', topic: 'Fracture Classification',
    tags: ['fracture', 'AO/OTA', 'guidelines', 'classification'], status: 'active', version: '2.3',
    uploadedBy: 'Dr. Nguyen Minh', uploadedAt: '2026-01-28', lastModified: '2026-01-28',
    retrievalCount: 456, lastIndexed: '2026-01-28', fileSize: '4.2 MB', fileType: 'PDF',
  },
  {
    id: '2', title: 'Osteoarthritis Imaging Features & Differential Diagnosis', topic: 'Degenerative Disease',
    tags: ['osteoarthritis', 'imaging', 'differential'], status: 'active', version: '1.5',
    uploadedBy: 'Dr. Tran Hoang', uploadedAt: '2026-01-25', lastModified: '2026-01-26',
    retrievalCount: 312, lastIndexed: '2026-01-26', fileSize: '3.8 MB', fileType: 'PDF',
  },
  {
    id: '3', title: 'Bone Tumor Radiology - Teaching Material 2025', topic: 'Bone Tumor',
    tags: ['tumor', 'radiology', 'osteosarcoma'], status: 'outdated', version: '1.0',
    uploadedBy: 'Dr. Le Thanh', uploadedAt: '2025-06-15', lastModified: '2025-06-15',
    retrievalCount: 189, lastIndexed: '2025-06-16', fileSize: '6.1 MB', fileType: 'PDF',
  },
  {
    id: '4', title: 'Osteoporosis Screening & Diagnosis Criteria', topic: 'Osteoporosis',
    tags: ['osteoporosis', 'screening', 'DEXA'], status: 'draft', version: '0.1',
    uploadedBy: 'Dr. Pham Expert', uploadedAt: '2026-02-01', lastModified: '2026-02-01',
    retrievalCount: 0, lastIndexed: 'Not indexed', fileSize: '2.4 MB', fileType: 'PDF',
  },
  {
    id: '5', title: 'Knee Joint Anatomy & Pathology Atlas', topic: 'Anatomy',
    tags: ['knee', 'anatomy', 'pathology', 'atlas'], status: 'active', version: '3.1',
    uploadedBy: 'Dr. Hoang Expert', uploadedAt: '2025-11-10', lastModified: '2026-01-15',
    retrievalCount: 287, lastIndexed: '2026-01-15', fileSize: '12.3 MB', fileType: 'PDF',
  },
  {
    id: '6', title: 'Spine Lesion Identification Guide', topic: 'Spine',
    tags: ['spine', 'lesion', 'identification', 'MRI'], status: 'active', version: '2.0',
    uploadedBy: 'Dr. Nguyen Minh', uploadedAt: '2025-10-20', lastModified: '2025-12-08',
    retrievalCount: 234, lastIndexed: '2025-12-08', fileSize: '5.7 MB', fileType: 'PDF',
  },
  {
    id: '7', title: 'Rheumatoid Arthritis Imaging (2024 Edition)', topic: 'Inflammatory Disease',
    tags: ['rheumatoid', 'arthritis', 'inflammatory', 'imaging'], status: 'outdated', version: '1.2',
    uploadedBy: 'Dr. Tran Hoang', uploadedAt: '2024-09-01', lastModified: '2024-09-01',
    retrievalCount: 98, lastIndexed: '2024-09-02', fileSize: '3.2 MB', fileType: 'PDF',
  },
  {
    id: '8', title: 'Bone Density Assessment Methods & DEXA Interpretation', topic: 'Osteoporosis',
    tags: ['bone density', 'DEXA', 'T-score', 'assessment'], status: 'active', version: '1.8',
    uploadedBy: 'Dr. Pham Expert', uploadedAt: '2025-08-12', lastModified: '2026-01-20',
    retrievalCount: 198, lastIndexed: '2026-01-20', fileSize: '2.9 MB', fileType: 'PDF',
  },
  {
    id: '9', title: 'Pediatric Bone Fracture Patterns', topic: 'Pediatric',
    tags: ['pediatric', 'fracture', 'growth plate', 'Salter-Harris'], status: 'active', version: '1.3',
    uploadedBy: 'Dr. Le Thanh', uploadedAt: '2025-07-05', lastModified: '2025-11-30',
    retrievalCount: 156, lastIndexed: '2025-11-30', fileSize: '4.5 MB', fileType: 'PDF',
  },
  {
    id: '10', title: 'Shoulder Dislocation Types Overview', topic: 'Trauma',
    tags: ['shoulder', 'dislocation', 'trauma', 'Bankart'], status: 'active', version: '1.1',
    uploadedBy: 'Dr. Hoang Expert', uploadedAt: '2025-09-18', lastModified: '2025-09-18',
    retrievalCount: 134, lastIndexed: '2025-09-19', fileSize: '3.0 MB', fileType: 'PDF',
  },
  {
    id: '11', title: 'Hip Replacement Post-Op Imaging Guide', topic: 'Post-Operative',
    tags: ['hip', 'replacement', 'post-op', 'imaging'], status: 'draft', version: '0.3',
    uploadedBy: 'Dr. Nguyen Minh', uploadedAt: '2026-02-10', lastModified: '2026-02-10',
    retrievalCount: 0, lastIndexed: 'Not indexed', fileSize: '5.1 MB', fileType: 'PDF',
  },
  {
    id: '12', title: 'Spinal Cord Injury Assessment Protocol', topic: 'Spine',
    tags: ['spinal cord', 'injury', 'ASIA scale', 'protocol'], status: 'active', version: '2.1',
    uploadedBy: 'Dr. Tran Hoang', uploadedAt: '2025-12-01', lastModified: '2026-02-05',
    retrievalCount: 178, lastIndexed: '2026-02-05', fileSize: '3.6 MB', fileType: 'PDF',
  },
  {
    id: '13', title: 'Metabolic Bone Disease Overview (2023)', topic: 'Metabolic',
    tags: ['metabolic', 'Paget', 'rickets', 'hyperparathyroidism'], status: 'archived', version: '1.0',
    uploadedBy: 'Dr. Le Thanh', uploadedAt: '2023-03-10', lastModified: '2023-03-10',
    retrievalCount: 45, lastIndexed: '2023-03-11', fileSize: '2.1 MB', fileType: 'PDF',
  },
];

const statusConfig: Record<DocStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' },
  draft: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Draft' },
  outdated: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Outdated' },
  archived: { icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Archived' },
};

const allStatuses: DocStatus[] = ['active', 'draft', 'outdated', 'archived'];

// Get unique topics
const allTopics = [...new Set(initialDocuments.map((d) => d.topic))].sort();

export default function CuratorDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'All'>('All');
  const [filterTopic, setFilterTopic] = useState<string>('All');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ doc: Document; action: 'archive' | 'delete' | 'reindex' } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.topic.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        d.uploadedBy.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || d.status === filterStatus;
      const matchTopic = filterTopic === 'All' || d.topic === filterTopic;
      return matchSearch && matchStatus && matchTopic;
    });
  }, [documents, search, filterStatus, filterTopic]);

  const stats = useMemo(() => ({
    active: documents.filter((d) => d.status === 'active').length,
    draft: documents.filter((d) => d.status === 'draft').length,
    outdated: documents.filter((d) => d.status === 'outdated').length,
    archived: documents.filter((d) => d.status === 'archived').length,
  }), [documents]);

  const handleConfirm = () => {
    if (!dialog) return;
    const { doc, action } = dialog;
    if (action === 'delete') {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } else if (action === 'archive') {
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, status: 'archived' as DocStatus } : d));
    }
    // reindex: just close dialog (mock)
    setDialog(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Document Management" subtitle={`${documents.length} documents in knowledge base`} />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
        </div>

        {/* Actions + Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, topic, tag, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="All">All Topics</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium text-card-foreground">No documents found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Document</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Topic</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Version</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Retrievals</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((doc) => {
                    const stConfig = statusConfig[doc.status];
                    const StIcon = stConfig.icon;
                    const isExpanded = expandedDoc === doc.id;

                    return (
                      <tr key={doc.id} className="hover:bg-input/30 transition-colors duration-150">
                        {/* Document */}
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                            className="flex items-start gap-2 text-left cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div>
                              <Link href={`/curator/documents/${doc.id}`} className="text-sm font-medium text-card-foreground hover:text-primary transition-colors">
                                {doc.title}
                              </Link>
                              {isExpanded && (
                                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {doc.uploadedBy}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {doc.uploadedAt}</span>
                                    <span>{doc.fileSize} &middot; {doc.fileType}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {doc.tags.map((tag) => (
                                      <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Last indexed: <span className="text-card-foreground">{doc.lastIndexed}</span>
                                    &nbsp;&middot;&nbsp;Modified: <span className="text-card-foreground">{doc.lastModified}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* Topic */}
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">{doc.topic}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${stConfig.bg} ${stConfig.color}`}>
                            <StIcon className="w-3.5 h-3.5" />
                            {stConfig.label}
                          </span>
                        </td>

                        {/* Version */}
                        <td className="px-5 py-3">
                          <span className="text-sm text-card-foreground font-mono">v{doc.version}</span>
                        </td>

                        {/* Retrievals */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            {doc.retrievalCount}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/curator/documents/${doc.id}`}
                              title="View / Edit"
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 cursor-pointer transition-colors"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Link>
                            {doc.status !== 'archived' && (
                              <button
                                onClick={() => setDialog({ doc, action: 'reindex' })}
                                title="Re-index document"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/10 cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-4 h-4 text-accent" />
                              </button>
                            )}
                            {doc.status !== 'archived' && (
                              <button
                                onClick={() => setDialog({ doc, action: 'archive' })}
                                title="Archive document"
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-warning/10 cursor-pointer transition-colors"
                              >
                                <Archive className="w-4 h-4 text-warning" />
                              </button>
                            )}
                            <button
                              onClick={() => setDialog({ doc, action: 'delete' })}
                              title="Delete document"
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

      {/* Upload Dialog */}
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} />}

      {/* Confirm Dialog */}
      {dialog && (
        <ConfirmDialog
          doc={dialog.doc}
          action={dialog.action}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Upload Document</h3>
            <p className="text-sm text-muted-foreground">Add new document to the knowledge base</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-card-foreground mb-1">
            Drag & drop files here
          </p>
          <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
            Choose Files
          </button>
          <p className="text-xs text-muted-foreground mt-3">Supported: PDF, DOCX, TXT (max 50MB)</p>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Title</label>
            <input
              type="text"
              placeholder="Document title..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Topic</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
                <option>Select topic...</option>
                {allTopics.map((t) => <option key={t} value={t}>{t}</option>)}
                <option value="new">+ New Topic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Version</label>
              <input
                type="text"
                placeholder="e.g., 1.0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Tags</label>
            <input
              type="text"
              placeholder="Comma-separated tags: fracture, imaging, guidelines..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border accent-primary" />
            <span className="text-sm text-card-foreground">Auto-index after upload</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  doc,
  action,
  onConfirm,
  onCancel,
}: {
  doc: Document;
  action: 'archive' | 'delete' | 'reindex';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = {
    archive: {
      icon: Archive,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      title: 'Archive Document',
      description: <>Archive <strong className="text-card-foreground">{doc.title}</strong>? It will no longer appear in RAG retrievals.</>,
      buttonText: 'Archive',
      buttonClass: 'bg-warning hover:bg-warning/90',
    },
    delete: {
      icon: Trash2,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      title: 'Delete Document',
      description: <>Permanently delete <strong className="text-card-foreground">{doc.title}</strong>? This will also remove all indexed segments.</>,
      buttonText: 'Delete',
      buttonClass: 'bg-destructive hover:bg-destructive/90',
    },
    reindex: {
      icon: RefreshCw,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      title: 'Re-index Document',
      description: <>Trigger re-indexing for <strong className="text-card-foreground">{doc.title}</strong>? This will regenerate embeddings for all segments.</>,
      buttonText: 'Re-index',
      buttonClass: 'bg-accent hover:bg-accent/90',
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
        <p className="text-sm text-muted-foreground text-center mb-4">{config.description}</p>

        {/* Doc info */}
        <div className="px-4 py-3 rounded-lg bg-input/50 mb-6">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded font-medium">{doc.topic}</span>
            <span className="text-xs text-muted-foreground">v{doc.version}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            By {doc.uploadedBy} &middot; {doc.retrievalCount} retrievals &middot; {doc.fileSize}
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
