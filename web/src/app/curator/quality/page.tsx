'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  TrendingDown,
  TrendingUp,
  FileText,
  Flag,
  CheckCircle,
  Search,
  Send,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Calendar,
} from 'lucide-react';

type AlertSeverity = 'warning' | 'error' | 'info';
type AlertStatus = 'open' | 'resolved' | 'flagged';

interface QualityAlert {
  id: string;
  documentTitle: string;
  documentId: string;
  reason: string;
  severity: AlertSeverity;
  status: AlertStatus;
  detectedAt: string;
  retrievalCount: number;
  relevanceScore: number;
}

interface TopSegment {
  id: string;
  documentTitle: string;
  content: string;
  retrievals: number;
  relevanceScore: number;
  trend: number;
}

const initialAlerts: QualityAlert[] = [
  { id: '1', documentTitle: 'Bone Tumor Radiology - Teaching Material 2025', documentId: '3', reason: 'Document is over 6 months old and may contain outdated information', severity: 'warning', status: 'open', detectedAt: '2026-03-20', retrievalCount: 189, relevanceScore: 0.62 },
  { id: '2', documentTitle: 'Rheumatoid Arthritis Imaging (2024 Edition)', documentId: '7', reason: 'Low retrieval relevance score (< 0.4) in recent queries', severity: 'error', status: 'open', detectedAt: '2026-03-19', retrievalCount: 98, relevanceScore: 0.34 },
  { id: '3', documentTitle: 'Shoulder Dislocation Types Overview', documentId: '10', reason: 'Flagged by clinical expert for content review', severity: 'warning', status: 'flagged', detectedAt: '2026-03-18', retrievalCount: 134, relevanceScore: 0.71 },
  { id: '4', documentTitle: 'Metabolic Bone Disease Overview (2023)', documentId: '13', reason: 'Document archived but still referenced in 3 active cases', severity: 'error', status: 'open', detectedAt: '2026-03-17', retrievalCount: 45, relevanceScore: 0.28 },
  { id: '5', documentTitle: 'Osteoarthritis Imaging Features v1.5', documentId: '2', reason: 'Multiple segments have declining retrieval relevance (-15% this month)', severity: 'warning', status: 'open', detectedAt: '2026-03-16', retrievalCount: 312, relevanceScore: 0.78 },
  { id: '6', documentTitle: 'Spine Lesion Identification Guide v2.0', documentId: '6', reason: 'New WHO classification released - document may need update', severity: 'info', status: 'resolved', detectedAt: '2026-03-10', retrievalCount: 234, relevanceScore: 0.85 },
];

const topSegments: TopSegment[] = [
  { id: 's1', documentTitle: 'Fracture Classification Systems', content: 'The AO/OTA classification divides fractures into three types: Type A (simple), Type B (wedge), Type C (complex)...', retrievals: 89, relevanceScore: 0.95, trend: 12 },
  { id: 's2', documentTitle: 'Fracture Classification Systems', content: 'Distal radius fractures are classified using AO 23 designation. 23-A: extra-articular, 23-B: partial articular...', retrievals: 72, relevanceScore: 0.92, trend: 8 },
  { id: 's3', documentTitle: 'Knee Joint Anatomy Atlas', content: 'The medial meniscus is C-shaped and attached to the deep medial collateral ligament. Tears commonly occur at...', retrievals: 68, relevanceScore: 0.90, trend: -3 },
  { id: 's4', documentTitle: 'Osteoarthritis Imaging Features', content: 'Kellgren-Lawrence grading system: Grade 0 (normal), Grade 1 (doubtful), Grade 2 (minimal), Grade 3 (moderate)...', retrievals: 61, relevanceScore: 0.88, trend: 5 },
  { id: 's5', documentTitle: 'Bone Density Assessment Methods', content: 'T-score interpretation: above -1.0 (normal), -1.0 to -2.5 (osteopenia), below -2.5 (osteoporosis)...', retrievals: 54, relevanceScore: 0.86, trend: 15 },
  { id: 's6', documentTitle: 'Spine Lesion Identification Guide', content: 'Red flags for spinal metastasis: age >50, history of cancer, progressive pain, weight loss, nocturnal pain...', retrievals: 47, relevanceScore: 0.84, trend: -8 },
  { id: 's7', documentTitle: 'Pediatric Bone Fracture Patterns', content: 'Salter-Harris classification: Type I (through physis), Type II (physis + metaphysis), Type III (physis + epiphysis)...', retrievals: 42, relevanceScore: 0.82, trend: 2 },
  { id: 's8', documentTitle: 'Rheumatoid Arthritis Imaging', content: 'Early RA findings on X-ray: periarticular osteopenia, soft tissue swelling, symmetric joint space narrowing...', retrievals: 15, relevanceScore: 0.35, trend: -22 },
];

const severityConfig = {
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Warning' },
  info: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', label: 'Info' },
};

const statusFilterOptions: (AlertStatus | 'all')[] = ['all', 'open', 'flagged', 'resolved'];

export default function CuratorQualityPage() {
  const [alerts, setAlerts] = useState<QualityAlert[]>(initialAlerts);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterAlertStatus, setFilterAlertStatus] = useState<AlertStatus | 'all'>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => ({
    open: alerts.filter((a) => a.status === 'open').length,
    flagged: alerts.filter((a) => a.status === 'flagged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    lowRelevance: topSegments.filter((s) => s.relevanceScore < 0.5).length,
    avgRelevance: Math.round(topSegments.reduce((sum, s) => sum + s.relevanceScore, 0) / topSegments.length * 100),
  }), [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSearch = a.documentTitle.toLowerCase().includes(search.toLowerCase()) || a.reason.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
      const matchStatus = filterAlertStatus === 'all' || a.status === filterAlertStatus;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [alerts, search, filterSeverity, filterAlertStatus]);

  const handleResolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved' as AlertStatus } : a));
  };

  const handleFlag = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'flagged' as AlertStatus } : a));
  };

  return (
    <div className="min-h-screen">
      <Header title="Content Quality" subtitle="Monitor retrieval performance and content health" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Open Issues</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{stats.flagged}</p>
              <p className="text-xs text-muted-foreground">Flagged</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{stats.avgRelevance}%</p>
              <p className="text-xs text-muted-foreground">Avg Relevance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">{stats.lowRelevance}</p>
              <p className="text-xs text-muted-foreground">Low Quality</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {statusFilterOptions.map((s) => (
              <button
                key={s}
                onClick={() => setFilterAlertStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  filterAlertStatus === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-input'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Alerts */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Quality Alerts ({filteredAlerts.length})
                </h3>
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="text-lg font-medium text-card-foreground">All clear!</p>
                  <p className="text-sm text-muted-foreground mt-1">No quality issues found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredAlerts.map((alert) => {
                    const sConfig = severityConfig[alert.severity];
                    const SIcon = sConfig.icon;
                    const isExpanded = expandedAlert === alert.id;

                    return (
                      <div key={alert.id} className={`px-5 py-4 hover:bg-input/20 transition-colors ${alert.status === 'resolved' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                            className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-card-foreground">{alert.documentTitle}</p>
                              <p className="text-xs text-muted-foreground mt-1">{alert.reason}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sConfig.bg} ${sConfig.color}`}>
                              <SIcon className="w-3 h-3" />
                              {sConfig.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              alert.status === 'open' ? 'bg-destructive/10 text-destructive' :
                              alert.status === 'flagged' ? 'bg-warning/10 text-warning' :
                              'bg-success/10 text-success'
                            }`}>
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 ml-6 space-y-3">
                            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-input/30">
                              <div>
                                <p className="text-xs text-muted-foreground">Retrievals</p>
                                <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" /> {alert.retrievalCount}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Relevance</p>
                                <p className={`text-sm font-medium ${alert.relevanceScore >= 0.7 ? 'text-success' : alert.relevanceScore >= 0.5 ? 'text-warning' : 'text-destructive'}`}>
                                  {(alert.relevanceScore * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Detected</p>
                                <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> {alert.detectedAt}
                                </p>
                              </div>
                            </div>

                            {alert.status !== 'resolved' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleResolve(alert.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 cursor-pointer transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Mark Resolved
                                </button>
                                {alert.status !== 'flagged' && (
                                  <button
                                    onClick={() => handleFlag(alert.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 cursor-pointer transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Flag for Expert
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Top segments */}
          <div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Most Retrieved Segments
                </h3>
              </div>
              <div className="divide-y divide-border">
                {topSegments.map((seg, idx) => (
                  <div key={seg.id} className="px-5 py-3 hover:bg-input/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">#{idx + 1} &middot; {seg.documentTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-card-foreground">{seg.retrievals}</span>
                        <span className={`text-xs flex items-center gap-0.5 ${seg.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {seg.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(seg.trend)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-card-foreground leading-relaxed line-clamp-2">{seg.content}</p>
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-muted-foreground">Relevance</span>
                        <span className={`text-xs font-medium ${seg.relevanceScore >= 0.8 ? 'text-success' : seg.relevanceScore >= 0.5 ? 'text-warning' : 'text-destructive'}`}>
                          {(seg.relevanceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${seg.relevanceScore >= 0.8 ? 'bg-success' : seg.relevanceScore >= 0.5 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${seg.relevanceScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
