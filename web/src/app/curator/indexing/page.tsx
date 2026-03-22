'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import {
  Database,
  CheckCircle,
  Loader2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
  Settings,
  FileText,
  Layers,
  Zap,
  Eye,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';

type JobStatus = 'completed' | 'in-progress' | 'failed' | 'queued';

interface IndexingJob {
  id: string;
  documentTitle: string;
  documentId: string;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  duration: string;
  chunksProcessed: number;
  totalChunks: number;
  errorMessage?: string;
  triggeredBy: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  jobId?: string;
}

const initialJobs: IndexingJob[] = [
  { id: 'j1', documentTitle: 'Fracture Classification Systems - AO/OTA Guidelines v2.3', documentId: '1', status: 'completed', startedAt: '2026-03-22 09:45', completedAt: '2026-03-22 09:47', duration: '2m 34s', chunksProcessed: 148, totalChunks: 148, triggeredBy: 'Auto (document update)' },
  { id: 'j2', documentTitle: 'Spinal Cord Injury Assessment Protocol', documentId: '12', status: 'in-progress', startedAt: '2026-03-22 10:12', duration: '1m 12s', chunksProcessed: 67, totalChunks: 120, triggeredBy: 'Manual' },
  { id: 'j3', documentTitle: 'Hip Replacement Post-Op Imaging Guide', documentId: '11', status: 'failed', startedAt: '2026-03-22 09:30', completedAt: '2026-03-22 09:31', duration: '0m 45s', chunksProcessed: 23, totalChunks: 95, errorMessage: 'Embedding generation failed: document contains unsupported image format in section 4.2', triggeredBy: 'Manual' },
  { id: 'j4', documentTitle: 'Pediatric Bone Fracture Patterns', documentId: '9', status: 'queued', startedAt: 'Queued', duration: '-', chunksProcessed: 0, totalChunks: 85, triggeredBy: 'Auto (scheduled)' },
  { id: 'j5', documentTitle: 'Osteoarthritis Imaging Features v1.5', documentId: '2', status: 'completed', startedAt: '2026-03-22 08:20', completedAt: '2026-03-22 08:23', duration: '3m 10s', chunksProcessed: 112, totalChunks: 112, triggeredBy: 'Auto (document update)' },
  { id: 'j6', documentTitle: 'Knee Joint Anatomy & Pathology Atlas v3.1', documentId: '5', status: 'completed', startedAt: '2026-03-21 16:45', completedAt: '2026-03-21 16:50', duration: '5m 22s', chunksProcessed: 287, totalChunks: 287, triggeredBy: 'Manual' },
  { id: 'j7', documentTitle: 'Bone Density Assessment Methods v1.8', documentId: '8', status: 'completed', startedAt: '2026-03-21 14:30', completedAt: '2026-03-21 14:32', duration: '1m 58s', chunksProcessed: 94, totalChunks: 94, triggeredBy: 'Auto (document update)' },
  { id: 'j8', documentTitle: 'Shoulder Dislocation Types Overview', documentId: '10', status: 'failed', startedAt: '2026-03-21 11:00', completedAt: '2026-03-21 11:01', duration: '0m 32s', chunksProcessed: 12, totalChunks: 78, errorMessage: 'Connection timeout to embedding service after 30s', triggeredBy: 'Auto (scheduled)' },
  { id: 'j9', documentTitle: 'Osteoporosis Screening & Diagnosis Criteria', documentId: '4', status: 'queued', startedAt: 'Queued', duration: '-', chunksProcessed: 0, totalChunks: 62, triggeredBy: 'Manual' },
];

const initialLogs: LogEntry[] = [
  { id: 'l1', timestamp: '2026-03-22 10:12:05', level: 'info', message: 'Started indexing: Spinal Cord Injury Assessment Protocol', jobId: 'j2' },
  { id: 'l2', timestamp: '2026-03-22 10:12:04', level: 'info', message: 'Chunking strategy applied: 512 tokens, 50 overlap', jobId: 'j2' },
  { id: 'l3', timestamp: '2026-03-22 09:47:34', level: 'info', message: 'Indexing completed: Fracture Classification Systems (148 chunks)', jobId: 'j1' },
  { id: 'l4', timestamp: '2026-03-22 09:31:15', level: 'error', message: 'Embedding generation failed for Hip Replacement Post-Op Guide: unsupported image format in section 4.2', jobId: 'j3' },
  { id: 'l5', timestamp: '2026-03-22 09:30:30', level: 'warning', message: 'Large document detected (95 chunks). Processing may take longer.', jobId: 'j3' },
  { id: 'l6', timestamp: '2026-03-22 08:23:10', level: 'info', message: 'Indexing completed: Osteoarthritis Imaging Features (112 chunks)', jobId: 'j5' },
  { id: 'l7', timestamp: '2026-03-21 16:50:22', level: 'info', message: 'Indexing completed: Knee Joint Anatomy Atlas (287 chunks)', jobId: 'j6' },
  { id: 'l8', timestamp: '2026-03-21 11:01:00', level: 'error', message: 'Connection timeout to embedding service after 30s', jobId: 'j8' },
  { id: 'l9', timestamp: '2026-03-21 11:00:32', level: 'warning', message: 'Embedding service response time > 10s, retry attempt 2/3', jobId: 'j8' },
  { id: 'l10', timestamp: '2026-03-21 11:00:10', level: 'warning', message: 'Embedding service response time > 10s, retry attempt 1/3', jobId: 'j8' },
];

const statusConfig: Record<JobStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string; barColor: string }> = {
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Completed', barColor: 'bg-success' },
  'in-progress': { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: 'In Progress', barColor: 'bg-primary' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed', barColor: 'bg-destructive' },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Queued', barColor: 'bg-muted-foreground' },
};

const logLevelConfig = {
  info: { color: 'text-primary', bg: 'bg-primary/10', icon: Activity },
  warning: { color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle },
  error: { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
};

const allStatuses: JobStatus[] = ['in-progress', 'queued', 'completed', 'failed'];

// Chunking presets
const chunkingPresets = [
  { name: 'Default', chunkSize: 512, overlap: 50, description: 'Balanced for most documents' },
  { name: 'Fine-grained', chunkSize: 256, overlap: 30, description: 'Better for short, dense content' },
  { name: 'Coarse', chunkSize: 1024, overlap: 100, description: 'Better for long narrative documents' },
  { name: 'Custom', chunkSize: 0, overlap: 0, description: 'Set your own parameters' },
];

export default function CuratorIndexingPage() {
  const [jobs, setJobs] = useState<IndexingJob[]>(initialJobs);
  const [logs] = useState<LogEntry[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeChunkPreset, setActiveChunkPreset] = useState('Default');
  const [customChunkSize, setCustomChunkSize] = useState(512);
  const [customOverlap, setCustomOverlap] = useState(50);
  const [dialog, setDialog] = useState<{ job: IndexingJob; action: 'retry' | 'cancel' | 'delete' } | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  const stats = useMemo(() => ({
    completed: jobs.filter((j) => j.status === 'completed').length,
    'in-progress': jobs.filter((j) => j.status === 'in-progress').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    totalChunks: jobs.filter((j) => j.status === 'completed').reduce((sum, j) => sum + j.totalChunks, 0),
  }), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch = j.documentTitle.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || j.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, filterStatus]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => logFilter === 'all' || l.level === logFilter);
  }, [logs, logFilter]);

  const handleConfirm = () => {
    if (!dialog) return;
    const { job, action } = dialog;
    if (action === 'delete') {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } else if (action === 'retry') {
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'queued' as JobStatus, chunksProcessed: 0, errorMessage: undefined, startedAt: 'Queued', duration: '-' } : j));
    } else if (action === 'cancel') {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    }
    setDialog(null);
  };

  const currentPreset = chunkingPresets.find((p) => p.name === activeChunkPreset)!;

  return (
    <div className="min-h-screen">
      <Header title="Indexing Pipeline" subtitle="Manage document embedding and indexing" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats + Pipeline Config */}
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
                  <Icon className={`w-5 h-5 ${config.color} ${status === 'in-progress' ? 'animate-spin' : ''}`} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-card-foreground">{stats[status]}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </button>
            );
          })}
          {/* Total chunks */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-card-foreground">{stats.totalChunks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Chunks</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium">
            <RefreshCw className="w-4 h-4" />
            Re-index All
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
              showConfig ? 'border-primary text-primary bg-primary/5' : 'border-border text-card-foreground hover:bg-input'
            }`}
          >
            <Settings className="w-4 h-4" />
            Chunking Config
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs by document title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Chunking Config Panel */}
        {showConfig && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Chunking Strategy Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
              {chunkingPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setActiveChunkPreset(preset.name);
                    if (preset.name !== 'Custom') {
                      setCustomChunkSize(preset.chunkSize);
                      setCustomOverlap(preset.overlap);
                    }
                  }}
                  className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                    activeChunkPreset === preset.name
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-input/50'
                  }`}
                >
                  <p className="text-sm font-medium text-card-foreground">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                  {preset.name !== 'Custom' && (
                    <p className="text-xs text-primary mt-2 font-mono">{preset.chunkSize} tokens / {preset.overlap} overlap</p>
                  )}
                </button>
              ))}
            </div>

            {activeChunkPreset === 'Custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Chunk Size (tokens)</label>
                  <input
                    type="number"
                    value={customChunkSize}
                    onChange={(e) => setCustomChunkSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Overlap (tokens)</label>
                  <input
                    type="number"
                    value={customOverlap}
                    onChange={(e) => setCustomOverlap(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Current: <span className="font-medium text-card-foreground font-mono">
                  {activeChunkPreset === 'Custom' ? customChunkSize : currentPreset.chunkSize} tokens, {activeChunkPreset === 'Custom' ? customOverlap : currentPreset.overlap} overlap
                </span>
              </p>
              <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
                Apply & Re-index
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Jobs Table */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Indexing Jobs ({filteredJobs.length})
                </h3>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium text-card-foreground">No jobs found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredJobs.map((job) => {
                    const config = statusConfig[job.status];
                    const StIcon = config.icon;
                    const progress = job.totalChunks > 0 ? (job.chunksProcessed / job.totalChunks) * 100 : 0;
                    const isExpanded = expandedJob === job.id;

                    return (
                      <div key={job.id} className="px-5 py-4 hover:bg-input/20 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                            className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">{job.documentTitle}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{job.startedAt}</span>
                                <span>&middot;</span>
                                <span>{job.duration}</span>
                                <span>&middot;</span>
                                <span>{job.triggeredBy}</span>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                              <StIcon className={`w-3.5 h-3.5 ${job.status === 'in-progress' ? 'animate-spin' : ''}`} />
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 ml-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{job.chunksProcessed}/{job.totalChunks} chunks</span>
                            <span className="text-xs font-medium text-card-foreground">{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${config.barColor} transition-all duration-300 rounded-full`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 ml-6 space-y-3">
                            {job.errorMessage && (
                              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
                                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                <p className="text-xs text-destructive">{job.errorMessage}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {job.status === 'failed' && (
                                <button
                                  onClick={() => setDialog({ job, action: 'retry' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Retry
                                </button>
                              )}
                              {(job.status === 'in-progress' || job.status === 'queued') && (
                                <button
                                  onClick={() => setDialog({ job, action: 'cancel' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 cursor-pointer transition-colors"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => setDialog({ job, action: 'delete' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
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

          {/* Right: Logs + Pipeline Info */}
          <div className="space-y-6">
            {/* Pipeline Status */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Pipeline Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Embedding Model</span>
                  <span className="text-sm font-medium text-card-foreground font-mono text-right">text-embedding-3-large</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vector DB</span>
                  <span className="text-sm font-medium text-card-foreground font-mono">ChromaDB v0.4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chunk Strategy</span>
                  <span className="text-sm font-medium text-card-foreground font-mono">
                    {activeChunkPreset === 'Custom' ? customChunkSize : currentPreset.chunkSize}t / {activeChunkPreset === 'Custom' ? customOverlap : currentPreset.overlap}o
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Speed</span>
                  <span className="text-sm font-medium text-card-foreground">~58 chunks/min</span>
                </div>
              </div>
            </div>

            {/* Indexing Logs */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Logs
                </h3>
                <div className="flex gap-1">
                  {(['all', 'info', 'warning', 'error'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setLogFilter(level)}
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                        logFilter === level
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-input'
                      }`}
                    >
                      {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {filteredLogs.map((log) => {
                  const lConfig = logLevelConfig[log.level];
                  const LIcon = lConfig.icon;
                  return (
                    <div key={log.id} className="px-4 py-3 hover:bg-input/20 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${lConfig.bg}`}>
                          <LIcon className={`w-3 h-3 ${lConfig.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-card-foreground leading-relaxed">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {dialog && (
        <ConfirmDialog
          job={dialog.job}
          action={dialog.action}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  job,
  action,
  onConfirm,
  onCancel,
}: {
  job: IndexingJob;
  action: 'retry' | 'cancel' | 'delete';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = {
    retry: {
      icon: RotateCcw, iconBg: 'bg-primary/10', iconColor: 'text-primary',
      title: 'Retry Job',
      description: <>Re-queue indexing for <strong className="text-card-foreground">{job.documentTitle}</strong>?</>,
      buttonText: 'Retry', buttonClass: 'bg-primary hover:bg-primary/90',
    },
    cancel: {
      icon: Pause, iconBg: 'bg-warning/10', iconColor: 'text-warning',
      title: 'Cancel Job',
      description: <>Cancel indexing for <strong className="text-card-foreground">{job.documentTitle}</strong>? Progress will be lost.</>,
      buttonText: 'Cancel Job', buttonClass: 'bg-warning hover:bg-warning/90',
    },
    delete: {
      icon: Trash2, iconBg: 'bg-destructive/10', iconColor: 'text-destructive',
      title: 'Remove Job',
      description: <>Remove this job record for <strong className="text-card-foreground">{job.documentTitle}</strong>?</>,
      buttonText: 'Remove', buttonClass: 'bg-destructive hover:bg-destructive/90',
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
