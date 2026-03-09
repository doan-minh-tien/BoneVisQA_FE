import Header from '@/components/Header';
import QuickStatsCard from '@/components/expert/QuickStatsCard';
import DocumentCard from '@/components/curator/DocumentCard';
import IndexingJobCard from '@/components/curator/IndexingJobCard';
import {
  FileText,
  Database,
  Clock,
  ShieldCheck,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Flag,
  TrendingUp,
  BarChart3,
  Eye,
} from 'lucide-react';

// Mock data
const curatorStats = [
  {
    title: 'Total Documents',
    value: '234',
    change: 8,
    trend: 'up' as const,
    icon: FileText,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Indexed Segments',
    value: '12,847',
    change: 15,
    trend: 'up' as const,
    icon: Database,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Pending Indexing',
    value: '7',
    change: -25,
    trend: 'down' as const,
    icon: Clock,
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Content Quality Score',
    value: '92%',
    change: 3,
    trend: 'up' as const,
    icon: ShieldCheck,
    iconColor: 'bg-success/10 text-success',
  },
];

const recentDocuments = [
  {
    id: '1',
    title: 'Fracture Classification Systems - AO/OTA Guidelines',
    topic: 'Fracture Classification',
    tags: ['fracture', 'AO/OTA', 'guidelines', 'classification'],
    status: 'active' as const,
    version: '2.3',
    uploadedAt: '2026-01-28',
    retrievalCount: 456,
    lastIndexed: '2026-01-28',
  },
  {
    id: '2',
    title: 'Osteoarthritis Imaging Features & Differential Diagnosis',
    topic: 'Degenerative Disease',
    tags: ['osteoarthritis', 'imaging', 'differential'],
    status: 'active' as const,
    version: '1.5',
    uploadedAt: '2026-01-25',
    retrievalCount: 312,
    lastIndexed: '2026-01-26',
  },
  {
    id: '3',
    title: 'Bone Tumor Radiology - Teaching Material 2025',
    topic: 'Bone Tumor',
    tags: ['tumor', 'radiology', 'osteosarcoma'],
    status: 'outdated' as const,
    version: '1.0',
    uploadedAt: '2025-06-15',
    retrievalCount: 189,
    lastIndexed: '2025-06-16',
  },
  {
    id: '4',
    title: 'Osteoporosis Screening & Diagnosis Criteria',
    topic: 'Osteoporosis',
    tags: ['osteoporosis', 'screening', 'DEXA'],
    status: 'draft' as const,
    version: '0.1',
    uploadedAt: '2026-02-01',
    retrievalCount: 0,
    lastIndexed: 'Not indexed',
  },
];

const indexingJobs = [
  {
    id: '1',
    documentTitle: 'Fracture Classification Systems - AO/OTA Guidelines v2.3',
    status: 'completed' as const,
    startedAt: '10 min ago',
    duration: '2m 34s',
    chunksProcessed: 148,
    totalChunks: 148,
  },
  {
    id: '2',
    documentTitle: 'Spinal Cord Injury Assessment Protocol',
    status: 'in-progress' as const,
    startedAt: '3 min ago',
    duration: '1m 12s',
    chunksProcessed: 67,
    totalChunks: 120,
  },
  {
    id: '3',
    documentTitle: 'Hip Replacement Post-Op Imaging Guide',
    status: 'failed' as const,
    startedAt: '25 min ago',
    duration: '0m 45s',
    chunksProcessed: 23,
    totalChunks: 95,
    errorMessage: 'Embedding generation failed: document contains unsupported image format in section 4.2',
  },
  {
    id: '4',
    documentTitle: 'Pediatric Bone Fracture Patterns',
    status: 'queued' as const,
    startedAt: 'Queued',
    duration: '-',
    chunksProcessed: 0,
    totalChunks: 85,
  },
];

const topRetrievedDocs = [
  { title: 'Fracture Classification Systems', retrievals: 456, trend: 12 },
  { title: 'Osteoarthritis Imaging Features', retrievals: 312, trend: 8 },
  { title: 'Knee Joint Anatomy & Pathology', retrievals: 287, trend: -3 },
  { title: 'Spine Lesion Identification Guide', retrievals: 234, trend: 15 },
  { title: 'Bone Density Assessment Methods', retrievals: 198, trend: 5 },
];

const qualityAlerts = [
  {
    title: 'Bone Tumor Radiology - Teaching Material 2025',
    reason: 'Document is over 6 months old and may contain outdated information',
    severity: 'warning' as const,
  },
  {
    title: 'Rheumatoid Arthritis Imaging (2024 Edition)',
    reason: 'Low retrieval relevance score (< 0.4) in recent queries',
    severity: 'error' as const,
  },
  {
    title: 'Shoulder Dislocation Types Overview',
    reason: 'Flagged by clinical expert for content review',
    severity: 'warning' as const,
  },
];

export default function CuratorDashboardPage() {
  const activeJobs = indexingJobs.filter((j) => j.status === 'in-progress').length;
  const queuedJobs = indexingJobs.filter((j) => j.status === 'queued').length;
  const failedJobs = indexingJobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="min-h-screen">
      <Header
        title="Content Curator Dashboard"
        subtitle="Manage knowledge base documents and indexing pipeline"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {curatorStats.map((stat) => (
            <QuickStatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer">
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Document</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer">
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Trigger Re-index</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Documents & Indexing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Recent Documents
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {recentDocuments.length} documents recently updated
                  </p>
                </div>
                <a
                  href="/curator/documents"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  View all
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentDocuments.map((doc) => (
                  <DocumentCard key={doc.id} {...doc} />
                ))}
              </div>
            </div>

            {/* Indexing Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Indexing Activity
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeJobs} active, {queuedJobs} queued, {failedJobs} failed
                  </p>
                </div>
                <a
                  href="/curator/indexing"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  View pipeline
                </a>
              </div>
              <div className="space-y-3">
                {indexingJobs.map((job) => (
                  <IndexingJobCard key={job.id} {...job} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Pipeline Status & Quality */}
          <div className="space-y-6">
            {/* Indexing Pipeline Status */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Pipeline Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <p className="text-lg font-bold text-card-foreground">Active</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Database className="w-6 h-6 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Embedding Model</p>
                    <p className="text-sm font-medium text-card-foreground">text-embedding-3-large</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vector DB</p>
                    <p className="text-sm font-medium text-card-foreground">ChromaDB v0.4</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chunk Strategy</p>
                    <p className="text-sm font-medium text-card-foreground">512 tokens, 50 overlap</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Quality Alerts */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">
                  Quality Alerts
                </h2>
                <span className="px-2 py-0.5 bg-destructive rounded-full text-xs font-medium text-white">
                  {qualityAlerts.length}
                </span>
              </div>
              <div className="space-y-3">
                {qualityAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'error'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-warning/30 bg-warning/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          alert.severity === 'error' ? 'text-destructive' : 'text-warning'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-card-foreground line-clamp-1">
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 px-4 py-2 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors duration-150 cursor-pointer">
                <span className="text-sm font-medium">Review All Alerts</span>
              </button>
            </div>

            {/* Top Retrieved Documents */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Top Retrieved Documents
              </h2>
              <div className="space-y-3">
                {topRetrievedDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        {idx + 1}.
                      </span>
                      <p className="text-sm text-card-foreground truncate">{doc.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-card-foreground">
                        {doc.retrievals}
                      </span>
                      <span
                        className={`text-xs ${
                          doc.trend >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {doc.trend >= 0 ? '+' : ''}{doc.trend}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">18</p>
            <p className="text-sm text-muted-foreground">Uploaded This Month</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">1,247</p>
            <p className="text-sm text-muted-foreground">Successful Indexes</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <Flag className="w-6 h-6 text-warning" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">6</p>
            <p className="text-sm text-muted-foreground">Flagged for Review</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">87%</p>
            <p className="text-sm text-muted-foreground">Avg Retrieval Relevance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
