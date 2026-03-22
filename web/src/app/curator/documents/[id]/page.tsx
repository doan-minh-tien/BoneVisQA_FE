'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  Eye,
  Calendar,
  User,
  Tags,
  RefreshCw,
  Trash2,
  X,
  Upload,
  History,
  Database,
  Edit,
  Plus,
} from 'lucide-react';

type DocStatus = 'active' | 'draft' | 'outdated' | 'archived';

interface DocVersion {
  version: string;
  date: string;
  uploadedBy: string;
  changes: string;
}

interface DocSegment {
  id: string;
  content: string;
  retrievalCount: number;
  relevanceScore: number;
}

interface DocumentDetail {
  id: string;
  title: string;
  description: string;
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
  totalSegments: number;
  versions: DocVersion[];
  topSegments: DocSegment[];
}

const mockDocuments: Record<string, DocumentDetail> = {
  '1': {
    id: '1',
    title: 'Fracture Classification Systems - AO/OTA Guidelines',
    description: 'Comprehensive guide to the AO/OTA fracture classification system, including detailed descriptions of fracture types for all major bone segments. This document serves as the primary reference for fracture classification in the BoneVisQA system.',
    topic: 'Fracture Classification',
    tags: ['fracture', 'AO/OTA', 'guidelines', 'classification'],
    status: 'active',
    version: '2.3',
    uploadedBy: 'Dr. Nguyen Minh',
    uploadedAt: '2026-01-28',
    lastModified: '2026-01-28',
    retrievalCount: 456,
    lastIndexed: '2026-01-28',
    fileSize: '4.2 MB',
    fileType: 'PDF',
    totalSegments: 148,
    versions: [
      { version: '2.3', date: '2026-01-28', uploadedBy: 'Dr. Nguyen Minh', changes: 'Updated pelvic ring fracture classification section' },
      { version: '2.2', date: '2025-11-15', uploadedBy: 'Dr. Nguyen Minh', changes: 'Added pediatric fracture classification appendix' },
      { version: '2.1', date: '2025-09-01', uploadedBy: 'Dr. Tran Hoang', changes: 'Corrected tibial plateau classification images' },
      { version: '2.0', date: '2025-06-10', uploadedBy: 'Dr. Nguyen Minh', changes: 'Major revision: reorganized by anatomical region' },
      { version: '1.0', date: '2024-08-15', uploadedBy: 'Dr. Le Thanh', changes: 'Initial upload' },
    ],
    topSegments: [
      { id: 's1', content: 'The AO/OTA classification divides fractures into three types: Type A (simple), Type B (wedge), and Type C (complex/multifragmentary). Each type is further subdivided into groups and subgroups...', retrievalCount: 89, relevanceScore: 0.95 },
      { id: 's2', content: 'Distal radius fractures are classified using the AO 23 designation. 23-A: extra-articular, 23-B: partial articular, 23-C: complete articular. Assessment requires AP and lateral radiographs...', retrievalCount: 72, relevanceScore: 0.92 },
      { id: 's3', content: 'Proximal femur fractures follow AO 31 classification. Femoral neck fractures (31-B) are critical due to risk of avascular necrosis. Garden classification is commonly used as supplement...', retrievalCount: 65, relevanceScore: 0.91 },
      { id: 's4', content: 'Tibial plateau fractures (AO 41) are classified by Schatzker system as complement. Type I: lateral split, Type II: lateral split-depression, Type III: lateral depression...', retrievalCount: 58, relevanceScore: 0.88 },
    ],
  },
};

function getDefaultDoc(id: string): DocumentDetail {
  return {
    id,
    title: `Document #${id}`,
    description: 'Document in the BoneVisQA knowledge base.',
    topic: 'General',
    tags: [],
    status: 'draft',
    version: '1.0',
    uploadedBy: 'Unknown',
    uploadedAt: '2025-01-01',
    lastModified: '2025-01-01',
    retrievalCount: 0,
    lastIndexed: 'Not indexed',
    fileSize: '0 MB',
    fileType: 'PDF',
    totalSegments: 0,
    versions: [],
    topSegments: [],
  };
}

const statusConfig: Record<DocStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' },
  draft: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Draft' },
  outdated: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Outdated' },
  archived: { icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Archived' },
};

export default function CuratorDocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const initial = mockDocuments[id] || getDefaultDoc(id);
  const [doc, setDoc] = useState<DocumentDetail>(initial);
  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [dialog, setDialog] = useState<'reindex' | 'archive' | 'delete' | null>(null);

  const stConfig = statusConfig[doc.status];
  const StIcon = stConfig.icon;

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !doc.tags.includes(tag)) {
      setDoc((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setDoc((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleConfirm = () => {
    if (dialog === 'archive') {
      setDoc((prev) => ({ ...prev, status: 'archived' }));
    }
    // delete/reindex: mock
    setDialog(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Document Detail" subtitle={doc.title} />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/curator/documents"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDialog('reindex')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Re-index
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Update Version
            </button>
            {doc.status !== 'archived' && (
              <button
                onClick={() => setDialog('archive')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-warning/50 text-sm font-medium text-warning hover:bg-warning/10 cursor-pointer transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}
            <button
              onClick={() => setDialog('delete')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-sm font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${stConfig.bg} ${stConfig.color}`}>
                  <StIcon className="w-3.5 h-3.5" />
                  {stConfig.label}
                </span>
                <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded font-medium">{doc.topic}</span>
                <span className="text-xs text-muted-foreground font-mono">v{doc.version}</span>
                <span className="text-xs text-muted-foreground">{doc.fileSize} &middot; {doc.fileType}</span>
              </div>
              <h2 className="text-xl font-bold text-card-foreground mb-3">{doc.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
            </div>

            {/* Tags */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Tags className="w-5 h-5 text-primary" />
                  Tags
                </h3>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {editingTags ? 'Done' : 'Edit Tags'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded font-medium">
                    {tag}
                    {editingTags && (
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {editingTags && (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag..."
                      className="w-28 px-2 py-1 rounded border border-border bg-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={handleAddTag}
                      className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Retrieved Segments */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Top Retrieved Segments ({doc.topSegments.length})
              </h3>
              {doc.topSegments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No indexed segments yet.</p>
              ) : (
                <div className="space-y-3">
                  {doc.topSegments.map((seg, idx) => (
                    <div key={seg.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Segment #{idx + 1}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {seg.retrievalCount} retrievals
                          </span>
                          <span className={`font-medium ${seg.relevanceScore >= 0.9 ? 'text-success' : seg.relevanceScore >= 0.7 ? 'text-warning' : 'text-destructive'}`}>
                            {(seg.relevanceScore * 100).toFixed(0)}% relevance
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-card-foreground leading-relaxed">{seg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Version History */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Version History ({doc.versions.length})
              </h3>
              {doc.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No version history.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-4">
                    {doc.versions.map((ver, idx) => (
                      <div key={ver.version} className="flex items-start gap-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          idx === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          <span className="text-xs font-bold">{ver.version}</span>
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-card-foreground">v{ver.version}</span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">Latest</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{ver.changes}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ver.uploadedBy} &middot; {ver.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Outdated Warning */}
            {doc.status === 'outdated' && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Outdated Content</h3>
                </div>
                <p className="text-sm text-destructive/80">
                  This document may contain outdated information. Please review and update to the latest version.
                </p>
              </div>
            )}

            {/* Document Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-card-foreground mb-4">Document Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded by</p>
                    <p className="text-sm font-medium text-card-foreground">{doc.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Upload date</p>
                    <p className="text-sm font-medium text-card-foreground">{doc.uploadedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Edit className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last modified</p>
                    <p className="text-sm font-medium text-card-foreground">{doc.lastModified}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last indexed</p>
                    <p className="text-sm font-medium text-card-foreground">{doc.lastIndexed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-card-foreground mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-input/50 text-center">
                  <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-card-foreground">{doc.retrievalCount}</p>
                  <p className="text-xs text-muted-foreground">Retrievals</p>
                </div>
                <div className="p-3 rounded-lg bg-input/50 text-center">
                  <Database className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xl font-bold text-card-foreground">{doc.totalSegments}</p>
                  <p className="text-xs text-muted-foreground">Segments</p>
                </div>
                <div className="p-3 rounded-lg bg-input/50 text-center">
                  <History className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-xl font-bold text-card-foreground">{doc.versions.length}</p>
                  <p className="text-xs text-muted-foreground">Versions</p>
                </div>
                <div className="p-3 rounded-lg bg-input/50 text-center">
                  <FileText className="w-5 h-5 text-success mx-auto mb-1" />
                  <p className="text-xl font-bold text-card-foreground">{doc.fileSize}</p>
                  <p className="text-xs text-muted-foreground">File Size</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {dialog && (
        <ConfirmDialog
          title={doc.title}
          action={dialog}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  action,
  onConfirm,
  onCancel,
}: {
  title: string;
  action: 'reindex' | 'archive' | 'delete';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = {
    reindex: {
      icon: RefreshCw, iconBg: 'bg-accent/10', iconColor: 'text-accent',
      title: 'Re-index Document',
      description: <>Regenerate embeddings for <strong className="text-card-foreground">{title}</strong>?</>,
      buttonText: 'Re-index', buttonClass: 'bg-accent hover:bg-accent/90',
    },
    archive: {
      icon: Archive, iconBg: 'bg-warning/10', iconColor: 'text-warning',
      title: 'Archive Document',
      description: <>Archive <strong className="text-card-foreground">{title}</strong>? It will be removed from RAG retrievals.</>,
      buttonText: 'Archive', buttonClass: 'bg-warning hover:bg-warning/90',
    },
    delete: {
      icon: Trash2, iconBg: 'bg-destructive/10', iconColor: 'text-destructive',
      title: 'Delete Document',
      description: <>Permanently delete <strong className="text-card-foreground">{title}</strong> and all indexed segments?</>,
      buttonText: 'Delete', buttonClass: 'bg-destructive hover:bg-destructive/90',
    },
  }[action];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${config.iconBg}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">{config.description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors ${config.buttonClass}`}>
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
