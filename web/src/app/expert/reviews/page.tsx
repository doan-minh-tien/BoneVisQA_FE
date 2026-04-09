'use client';

import { useCallback, useEffect, useState } from 'react';
import ExpertHeader from '@/components/expert/ExpertHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchEscalatedReviews,
  resolveEscalatedReview,
  flagRagChunk,
  type EscalatedReview,
  type EscalatedCitation,
} from '@/lib/api/expert-reviews';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Flag,
  Loader2,
  Mail,
  MessageSquare,
  Stethoscope,
  User,
  XCircle,
  FileText,
  Brain,
  ShieldCheck,
} from 'lucide-react';

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', cls: 'bg-warning/15 text-warning', icon: Clock },
  escalated: { label: 'Escalated', cls: 'bg-orange-500/15 text-orange-400', icon: AlertCircle },
  escalatedtoexpert: { label: 'Escalated to Expert', cls: 'bg-purple-500/15 text-purple-400', icon: AlertCircle },
  expertapproved: { label: 'Expert Approved', cls: 'bg-success/15 text-success', icon: CheckCircle },
  approved: { label: 'Approved', cls: 'bg-success/15 text-success', icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'bg-destructive/15 text-destructive', icon: XCircle },
  revised: { label: 'Revised', cls: 'bg-blue-500/15 text-blue-400', icon: FileText },
  requireslecturerreview: { label: 'Requires Lecturer Review', cls: 'bg-accent/15 text-accent', icon: BookOpen },
};

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s/g, '');
  const cfg = STATUS_CONFIG[key] ?? { label: status, cls: 'bg-muted/15 text-muted-foreground', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffh = Math.floor(diffMs / 3600000);
    const diffd = Math.floor(diffMs / 86400000);
    if (diffh < 1) return `${Math.floor(diffMs / 60000)} min ago`;
    if (diffh < 24) return `${diffh}h ago`;
    if (diffd < 7) return `${diffd}d ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

// ── Citation card ──────────────────────────────────────────────────────────────

function CitationCard({
  citation,
  index,
  flaggedIds,
  onFlag,
}: {
  citation: EscalatedCitation;
  index: number;
  flaggedIds: Set<string>;
  onFlag: (chunkId: string) => void;
}) {
  const isFlagged = flaggedIds.has(citation.chunkId);
  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${
        isFlagged ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card/60'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
            Chunk {index + 1}
          </span>
          {citation.pageNumber > 0 && <span>Page {citation.pageNumber}</span>}
          {isFlagged && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
              Flagged
            </span>
          )}
        </div>
        <button
          onClick={() => onFlag(citation.chunkId)}
          disabled={isFlagged}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
            isFlagged
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          }`}
        >
          <Flag className="h-3 w-3" />
          {isFlagged ? 'Flagged' : 'Flag Issue'}
        </button>
      </div>

      <blockquote className="rounded-lg border-l-4 border-primary bg-muted/30 px-4 py-3 text-sm leading-relaxed text-card-foreground">
        {citation.sourceText || <span className="italic text-muted-foreground">No source text</span>}
      </blockquote>

      {citation.referenceUrl && (
        <a
          href={citation.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-4 hover:opacity-80"
        >
          <ExternalLink className="h-3 w-3" />
          Open source reference
        </a>
      )}
    </article>
  );
}

// ── Resolve modal ──────────────────────────────────────────────────────────────

function ResolveModal({
  open,
  review,
  onClose,
  onResolved,
}: {
  open: boolean;
  review: EscalatedReview | null;
  onClose: () => void;
  onResolved: (updated: EscalatedReview) => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('ExpertApproved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNote(review?.reviewNote ?? '');
      setStatus('ExpertApproved');
    }
  }, [open, review]);

  if (!open || !review) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updated = await resolveEscalatedReview(review.answerId, {
        reviewNote: note.trim() || undefined,
        status,
      });
      toast.success('Review resolved successfully!');
      onResolved(updated);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resolve review');
    } finally {
      setSaving(false);
    }
  };

  const answerStatuses = [
    'ExpertApproved', 'Approved', 'Rejected', 'Revised',
    'Escalated', 'EscalatedToExpert', 'RequiresLecturerReview', 'Pending', 'Edited',
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-card-foreground mb-1">Resolve Review</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <strong>{review.studentName}</strong> — {review.caseTitle}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Resolution Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
            >
              {answerStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Review Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Provide your expert assessment or feedback for this answer..."
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Submit Resolution
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Flag modal ─────────────────────────────────────────────────────────────────

function FlagModal({
  open,
  chunkId,
  onClose,
  onFlagged,
}: {
  open: boolean;
  chunkId: string | null;
  onClose: () => void;
  onFlagged: (chunkId: string) => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open || !chunkId) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason before flagging.');
      return;
    }
    setSaving(true);
    try {
      await flagRagChunk(chunkId, { reason: reason.trim(), isFlagged: true });
      toast.success('Chunk flagged for data quality review.');
      onFlagged(chunkId);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to flag chunk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Flag className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-card-foreground">Flag Evidence Chunk</h3>
            <p className="text-xs text-muted-foreground">Report low-quality or irrelevant citation</p>
          </div>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="E.g. outdated information, irrelevant context, mismatched anatomy..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review detail panel ────────────────────────────────────────────────────────

function ReviewDetailPanel({
  review,
  flaggedIds,
  onFlag,
  onResolve,
}: {
  review: EscalatedReview;
  flaggedIds: Set<string>;
  onFlag: (chunkId: string) => void;
  onResolve: () => void;
}) {
  const confidence = review.aiConfidenceScore <= 1
    ? review.aiConfidenceScore * 100
    : review.aiConfidenceScore;

  return (
    <div className="border-t border-border px-5 py-5">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Student & Case info */}
        <div className="space-y-4">
          {/* Student info */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Student Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-card-foreground">{review.studentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{review.studentEmail || '—'}</span>
              </div>
              {review.className && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent shrink-0" />
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{review.className}</span>
                </div>
              )}
            </div>
          </div>

          {/* Question */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student Question</h4>
            </div>
            <p className="text-sm leading-relaxed text-card-foreground">{review.questionText || '—'}</p>
          </div>

          {/* Current answer */}
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Answer</h4>
            </div>
            <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">{review.currentAnswerText || '—'}</p>
          </div>

          {/* AI Confidence bar */}
          {confidence > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold uppercase tracking-widest text-muted-foreground">AI Confidence</span>
                <span className="font-bold text-primary">{confidence.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    confidence >= 80 ? 'bg-success' : confidence >= 50 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(100, confidence)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Diagnosis + Citations */}
        <div className="space-y-4">
          {/* Structured diagnosis */}
          {review.structuredDiagnosis && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Structured Diagnosis</h4>
              </div>
              <p className="text-sm leading-relaxed text-card-foreground">{review.structuredDiagnosis}</p>
            </div>
          )}

          {/* Differential diagnoses */}
          {review.differentialDiagnoses && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Differential Diagnoses</h4>
              <p className="text-sm leading-relaxed text-card-foreground">{review.differentialDiagnoses}</p>
            </div>
          )}

          {/* Citations */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                RAG Citations ({review.citations.length})
              </h4>
            </div>
            {review.citations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                No evidence chunks for this case.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {review.citations.map((citation, idx) => (
                  <CitationCard
                    key={citation.chunkId || idx}
                    citation={citation}
                    index={idx}
                    flaggedIds={flaggedIds}
                    onFlag={onFlag}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-primary" />
          Escalated {formatDate(review.escalatedAt)}
          {review.reviewNote && (
            <span className="ml-2 italic text-xs">· "{review.reviewNote}"</span>
          )}
        </div>
        <button
          onClick={onResolve}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" />
          Resolve Review
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ExpertReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<EscalatedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Flag modal
  const [flagChunkId, setFlagChunkId] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Resolve modal
  const [resolveTarget, setResolveTarget] = useState<EscalatedReview | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEscalatedReviews();
      setReviews(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load escalated reviews');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const allStatuses = ['All', ...Array.from(new Set(reviews.map((r) => r.status)))];

  const filtered = statusFilter === 'All'
    ? reviews
    : reviews.filter((r) => r.status === statusFilter);

  const handleFlagged = (chunkId: string) => {
    setFlaggedIds((prev) => new Set([...prev, chunkId]));
  };

  const handleResolved = (updated: EscalatedReview) => {
    setReviews((prev) =>
      prev.map((r) => (r.answerId === updated.answerId ? updated : r))
    );
  };

  return (
    <div className="min-h-screen">
      <ExpertHeader
        title="Escalated Reviews"
        subtitle={`${filtered.length} review${filtered.length !== 1 ? 's' : ''} awaiting expert decision`}
      />

      <div className="mx-auto max-w-[1400px] p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-card-foreground focus:outline-none appearance-none cursor-pointer hover:border-primary/50 transition-colors"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Pending
              <span className="w-2 h-2 rounded-full bg-success inline-block ml-2" /> Resolved
              <span className="w-2 h-2 rounded-full bg-destructive inline-block ml-2" /> Rejected
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm">Loading escalated reviews...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-success mx-auto mb-3 opacity-60" />
            <p className="text-lg font-semibold text-card-foreground mb-1">All clear!</p>
            <p className="text-sm text-muted-foreground">No escalated reviews matching the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((review) => {
              const isExp = expanded === review.answerId;
              const confidence = review.aiConfidenceScore <= 1
                ? review.aiConfidenceScore * 100
                : review.aiConfidenceScore;

              return (
                <div
                  key={review.answerId}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isExp ? null : review.answerId)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                  >
                    {isExp
                      ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-card-foreground line-clamp-1">
                            {review.caseTitle}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {review.questionText}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {review.studentName}
                            </span>
                            {review.className && (
                              <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                {review.className}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.escalatedAt)}
                            </span>
                            <StatusBadge status={review.status} />
                          </div>
                        </div>

                        {/* Confidence mini-bar */}
                        {confidence > 0 && (
                          <div className="w-32 shrink-0">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span>AI Confidence</span>
                              <span className="font-semibold text-primary">{confidence.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  confidence >= 80 ? 'bg-success' : confidence >= 50 ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${Math.min(100, confidence)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExp && (
                    <ReviewDetailPanel
                      review={review}
                      flaggedIds={flaggedIds}
                      onFlag={(chunkId) => setFlagChunkId(chunkId)}
                      onResolve={() => setResolveTarget(review)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FlagModal
        open={Boolean(flagChunkId)}
        chunkId={flagChunkId}
        onClose={() => setFlagChunkId(null)}
        onFlagged={handleFlagged}
      />

      <ResolveModal
        open={Boolean(resolveTarget)}
        review={resolveTarget}
        onClose={() => setResolveTarget(null)}
        onResolved={handleResolved}
      />
    </div>
  );
}
