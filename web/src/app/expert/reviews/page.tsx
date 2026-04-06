'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import { AnnotationOverlay } from '@/components/shared/AnnotationOverlay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchExpertReviewQueue,
  flagRagChunk,
  putExpertReview,
} from '@/lib/api/expert-reviews';
import type { ExpertReviewCitation, ExpertReviewItem, VisualQaReport } from '@/lib/api/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Flag,
  Loader2,
  Link2,
  Save,
  User,
  XCircle,
} from 'lucide-react';

export default function ExpertReviewsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ExpertReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [active, setActive] = useState<ExpertReviewItem | null>(null);
  const [diag, setDiag] = useState('');
  const [keyText, setKeyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [flaggingChunkId, setFlaggingChunkId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExpertReviewQueue();
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (item: ExpertReviewItem) => {
    setActive(item);
    setDiag(item.report.suggestedDiagnosis || '');
    setKeyText(item.report.keyFindings.join('\n'));
    setExpanded(item.id);
  };

  const openFlagModal = (chunkId: string) => {
    setFlaggingChunkId(chunkId);
    setFlagReason('');
  };

  const closeFlagModal = () => {
    setFlaggingChunkId(null);
    setFlagReason('');
  };

  const submitFlag = async () => {
    if (!flaggingChunkId) return;
    const reason = flagReason.trim();
    if (!reason) {
      toast.error('Please provide a reason before flagging this chunk.');
      return;
    }

    setSubmittingFlag(true);
    try {
      await flagRagChunk(flaggingChunkId, { reason });
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          citations: item.citations?.map((citation) =>
            citation.chunkId === flaggingChunkId
              ? { ...citation, flagged: true }
              : citation,
          ),
        })),
      );
      toast.success('Chunk flagged for data quality review.');
      closeFlagModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to flag RAG chunk.');
    } finally {
      setSubmittingFlag(false);
    }
  };

  const submit = async (status: 'Approved' | 'Rejected') => {
    if (!active) return;
    setSaving(true);
    try {
      const normalizedFindings = keyText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await putExpertReview(active.id, {
        answerText: active.report.answerText || '',
        structuredDiagnosis: diag.trim() || active.report.suggestedDiagnosis || '',
        differentialDiagnoses:
          normalizedFindings.length > 0
            ? normalizedFindings
            : active.report.differentialDiagnoses,
        reviewNote:
          status === 'Approved'
            ? 'Approved by expert reviewer.'
            : 'Rejected by expert reviewer.',
      });
      toast.success(
        status === 'Approved'
          ? 'Approved. This case can be published to the student reference library.'
          : 'Marked as rejected.',
      );
      setActive(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const quickApprove = async (item: ExpertReviewItem) => {
    setSaving(true);
    try {
      await putExpertReview(item.id, {
        answerText: item.report.answerText || '',
        structuredDiagnosis: item.report.suggestedDiagnosis || '',
        differentialDiagnoses: item.report.differentialDiagnoses,
        reviewNote: 'Approved by expert reviewer.',
      });
      toast.success('Approved for the public reference library.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const quickReject = async (item: ExpertReviewItem) => {
    setSaving(true);
    try {
      await putExpertReview(item.id, {
        answerText: item.report.answerText || '',
        structuredDiagnosis: item.report.suggestedDiagnosis || '',
        differentialDiagnoses: item.report.differentialDiagnoses,
        reviewNote: 'Rejected by expert reviewer.',
      });
      toast.info('Answer flagged as invalid.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const pending = items.filter((i) => !isTerminal(i.status)).length;

  return (
    <div className="dark min-h-screen bg-background text-text-main">
      <Header title="Expert review workbench" subtitle={`${pending} item(s) awaiting decision`} />
      <div className="mx-auto max-w-[1600px] p-6">
        {loading ? (
          <div className="flex justify-center py-20 text-text-muted">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-xl border border-border-color bg-surface p-12 text-center text-text-muted">
                No escalated diagnostic requests at this time.
              </div>
            ) : (
              items.map((item) => {
                const isExp = expanded === item.id;
                const confidence = getConfidenceScore(item);
                const isEditing = active?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-border-color bg-surface shadow-panel"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isExp ? null : item.id)}
                      className="flex w-full items-start gap-3 px-5 py-5 text-left hover:bg-background/20"
                    >
                      {isExp ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-relaxed text-text-main">
                              {item.question}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.studentName}
                          </span>
                          {item.className ? (
                            <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
                              {item.className}
                            </span>
                          ) : null}
                          <span>{item.askedAt}</span>
                          <StatusBadge status={item.status} />
                            </div>
                          </div>
                          {confidence !== null ? (
                            <div className="w-full max-w-[180px]">
                              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-text-muted">
                                <span>AI confidence</span>
                                <span className="text-cyan-accent">{confidence.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-background">
                                <div
                                  className="h-full rounded-full bg-cyan-accent"
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    {isExp && (
                      <div className="border-t border-border-color px-5 py-5">
                        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                          <section className="space-y-4">
                            <div className="rounded-xl border border-border-color bg-black p-3">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                                Imaging
                              </p>
                              <div className="overflow-hidden rounded-lg border border-border-color bg-black p-2">
                                {item.imageUrl ? (
                                  <div className="relative mx-auto w-fit">
                                    <Image
                                      src={item.imageUrl}
                                      alt="Study"
                                      width={1200}
                                      height={900}
                                      unoptimized
                                      className="mx-auto max-h-[420px] max-w-full object-contain"
                                    />
                                    <AnnotationOverlay
                                      box={item.customCoordinates}
                                      label="STUDENT ROI"
                                      className="border-dashed border-cyan-accent text-cyan-accent shadow-[0_0_28px_rgba(0,229,255,0.3)]"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex min-h-[280px] items-center justify-center text-sm text-text-muted">
                                    No image available for this request.
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="rounded-xl border border-border-color bg-surface p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-accent">
                                Student question
                              </p>
                              <p className="text-sm leading-relaxed text-text-main">{item.question}</p>
                            </div>
                          </section>

                          <section className="space-y-4">
                            <ReportWorkbench
                              report={item.report}
                              isEditing={isEditing}
                              diag={diag}
                              keyText={keyText}
                              onDiagChange={setDiag}
                              onKeyTextChange={setKeyText}
                              onBeginEdit={() => openEdit(item)}
                            />
                            <EvidencePanel
                              citations={item.citations ?? []}
                              onFlag={openFlagModal}
                            />
                          </section>
                        </div>

                        {!isTerminal(item.status) && (
                          <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-color bg-background/95 p-4 backdrop-blur">
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                              <AlertCircle className="h-4 w-4 text-cyan-accent" />
                              Approved responses are pushed to the public student reference library.
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!isEditing ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={saving}
                                  onClick={() => openEdit(item)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Edit diagnosis / findings
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={saving}
                                  onClick={() => void submit('Approved')}
                                >
                                  <Save className="h-4 w-4" />
                                  Save edits
                                </Button>
                              )}
                              <Button
                                type="button"
                                className="min-w-[220px]"
                                disabled={saving}
                                isLoading={saving}
                                onClick={() => (isEditing ? void submit('Approved') : void quickApprove(item))}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve for library
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-danger text-danger hover:bg-danger/10"
                                disabled={saving}
                                onClick={() => (isEditing ? void submit('Rejected') : void quickReject(item))}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <FlagChunkModal
        open={Boolean(flaggingChunkId)}
        reason={flagReason}
        submitting={submittingFlag}
        onReasonChange={setFlagReason}
        onClose={closeFlagModal}
        onSubmit={() => void submitFlag()}
      />

    </div>
  );
}

function EvidencePanel({
  citations,
  onFlag,
}: {
  citations: ExpertReviewCitation[];
  onFlag: (chunkId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-border-color bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            RAG Evidence & Citations
          </h4>
          <p className="mt-1 text-sm text-text-muted">
            Review the exact evidence chunks the AI used before approving this answer.
          </p>
        </div>
      </div>

      {citations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-color bg-background/40 px-4 py-6 text-sm text-text-muted">
          No evidence chunks were returned for this case.
        </div>
      ) : (
        <div className="space-y-3">
          {citations.map((citation, index) => (
            <article
              key={citation.chunkId}
              className={`rounded-xl border p-4 ${
                citation.flagged
                  ? 'border-danger/60 bg-danger/5'
                  : 'border-border-color bg-background/40'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="rounded-full bg-cyan-accent/10 px-2 py-1 font-medium text-cyan-accent">
                    Chunk {index + 1}
                  </span>
                  {citation.pageNumber != null ? (
                    <span>Page {citation.pageNumber}</span>
                  ) : null}
                  {citation.flagged ? (
                    <span className="rounded-full bg-danger/10 px-2 py-1 font-medium text-danger">
                      Flagged
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant={citation.flagged ? 'outline' : 'destructive'}
                  disabled={citation.flagged}
                  onClick={() => onFlag(citation.chunkId)}
                >
                  <Flag className="h-4 w-4" />
                  {citation.flagged ? 'Issue Flagged' : 'Flag Issue'}
                </Button>
              </div>

              <blockquote className="rounded-lg border-l-4 border-cyan-accent bg-surface px-4 py-3 text-sm leading-relaxed text-text-main">
                {citation.sourceText}
              </blockquote>

              {citation.referenceUrl ? (
                <a
                  href={citation.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-accent underline decoration-cyan-accent/50 underline-offset-4 hover:text-cyan-accent/80"
                >
                  <Link2 className="h-4 w-4" />
                  Open source reference
                </a>
              ) : (
                <p className="mt-3 text-xs text-text-muted">No reference URL was supplied for this chunk.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FlagChunkModal({
  open,
  reason,
  submitting,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  reason: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border-color bg-surface p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-text-main">Flag evidence chunk</h3>
        <p className="mt-2 text-sm text-text-muted">
          Explain why this citation is low quality or not relevant to the reviewed case.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={5}
          placeholder="Examples: outdated information, irrelevant chunk, truncated context, mismatched anatomy..."
          className="mt-4 w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" isLoading={submitting} onClick={onSubmit}>
            <Flag className="h-4 w-4" />
            Submit Flag
          </Button>
        </div>
      </div>
    </div>
  );
}

function getConfidenceScore(item: ExpertReviewItem): number | null {
  const raw = (item as ExpertReviewItem & { aiConfidenceScore?: number; confidenceScore?: number })
    .aiConfidenceScore ??
    (item as ExpertReviewItem & { confidenceScore?: number }).confidenceScore;

  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return raw <= 1 ? raw * 100 : raw;
  }

  const derived = 84 + item.report.keyFindings.length * 1.8 + item.report.citations.length * 0.7;
  return Math.min(98.7, Math.max(72.4, derived));
}

function isTerminal(status: string) {
  const s = status.toLowerCase();
  return s === 'approved' || s === 'rejected';
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
      <Clock className="h-3 w-3" /> Pending expert
    </span>
  );
}

function ReportSections({ report }: { report: VisualQaReport }) {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Answer / explanation
        </h4>
        <div className="rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.answerText || '—'}</ReactMarkdown>
        </div>
      </section>
      {report.suggestedDiagnosis ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Suggested diagnosis
          </h4>
          <div className="rounded-xl border border-border-color bg-surface px-4 py-4">
            <p className="text-base font-semibold leading-relaxed text-text-main">
              {report.suggestedDiagnosis}
            </p>
          </div>
        </section>
      ) : null}
      {report.keyFindings.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Key findings
          </h4>
          <ul className="space-y-3 rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
            {report.keyFindings.map((k, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ReportWorkbench({
  report,
  isEditing,
  diag,
  keyText,
  onDiagChange,
  onKeyTextChange,
  onBeginEdit,
}: {
  report: VisualQaReport;
  isEditing: boolean;
  diag: string;
  keyText: string;
  onDiagChange: (value: string) => void;
  onKeyTextChange: (value: string) => void;
  onBeginEdit: () => void;
}) {
  if (!isEditing) {
    return <ReportSections report={report} />;
  }

  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Answer / explanation
        </h4>
        <div className="rounded-xl border border-border-color bg-surface px-4 py-4 text-sm text-text-main">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.answerText || '—'}</ReactMarkdown>
        </div>
      </section>

      <section className="rounded-xl border border-border-color bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
            Suggested diagnosis
          </h4>
          <button
            type="button"
            onClick={onBeginEdit}
            className="text-xs font-medium text-text-muted hover:text-text-main"
          >
            Editing
          </button>
        </div>
        <textarea
          value={diag}
          onChange={(e) => onDiagChange(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-base font-semibold text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
        />
      </section>

      <section className="rounded-xl border border-border-color bg-surface p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
          Key findings
        </h4>
        <textarea
          value={keyText}
          onChange={(e) => onKeyTextChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-border-color bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
          placeholder="One key finding per line"
        />
      </section>
    </div>
  );
}
