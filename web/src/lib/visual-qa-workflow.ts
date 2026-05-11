export type WorkflowStatusTone = 'neutral' | 'pending' | 'success' | 'danger';

const STATUS_ALIASES: Record<string, string> = {
  pending: 'PendingExpertReview',
  pendingreview: 'PendingExpertReview',
  pendingexpert: 'PendingExpertReview',
  pendingexpertreview: 'PendingExpertReview',
  hold: 'PendingExpertReview',
  lecturerapproved: 'LecturerApproved',
  approvedbylecturer: 'LecturerApproved',
  escalated: 'EscalatedToExpert',
  escalatedtoexpert: 'EscalatedToExpert',
  expertpending: 'EscalatedToExpert',
  approved: 'ExpertApproved',
  expertapproved: 'ExpertApproved',
  resolved: 'ExpertApproved',
  rejected: 'Rejected',
  lecturerrejected: 'Rejected',
  expertrejected: 'Rejected',
  promoted: 'PromotedToCase',
  promotedtocase: 'PromotedToCase',
};

const STATUS_META: Record<
  string,
  { label: string; tone: WorkflowStatusTone; terminal: boolean }
> = {
  PendingExpertReview: { label: 'Pending review', tone: 'pending', terminal: false },
  LecturerApproved: { label: 'Lecturer approved', tone: 'neutral', terminal: false },
  EscalatedToExpert: { label: 'Escalated to expert', tone: 'pending', terminal: false },
  ExpertApproved: { label: 'Expert approved', tone: 'success', terminal: true },
  Rejected: { label: 'Rejected', tone: 'danger', terminal: true },
  PromotedToCase: { label: 'Promoted to case', tone: 'success', terminal: true },
};

export function normalizeWorkflowStatus(raw: string | null | undefined): string {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!key) return 'PendingExpertReview';
  return STATUS_ALIASES[key] ?? String(raw ?? '').trim() ?? 'PendingExpertReview';
}

export function getWorkflowStatusMeta(raw: string | null | undefined) {
  const normalized = normalizeWorkflowStatus(raw);
  return STATUS_META[normalized] ?? { label: normalized || 'Unknown', tone: 'neutral' as const, terminal: false };
}

export function isEscalationBlocked(raw: string | null | undefined): boolean {
  const normalized = normalizeWorkflowStatus(raw);
  return (
    normalized === 'EscalatedToExpert' ||
    normalized === 'ExpertApproved' ||
    normalized === 'PromotedToCase'
  );
}

export function canExpertApprove(raw: string | null | undefined): boolean {
  const normalized = normalizeWorkflowStatus(raw);
  return normalized !== 'ExpertApproved' && normalized !== 'Rejected';
}

export function isExpertApproved(raw: string | null | undefined): boolean {
  return normalizeWorkflowStatus(raw) === 'ExpertApproved';
}

