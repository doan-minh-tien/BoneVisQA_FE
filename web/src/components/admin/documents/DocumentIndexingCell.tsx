'use client';

import { normalizeIndexingStatus, type DocumentDto } from '@/lib/api/admin-documents';
import type { DocumentStatusResponse } from '@/lib/api/types';

function StaticIndexingBadge({ statusRaw }: { statusRaw: string | undefined }) {
  const n = normalizeIndexingStatus(statusRaw);
  const base =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold';
  switch (n) {
    case 'pending':
      return (
        <span className={`${base} border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200`}>
          <span aria-hidden>🟡</span>
          Pending <span className="font-normal text-muted-foreground">(Chờ xử lý)</span>
        </span>
      );
    case 'processing':
      return (
        <span className={`${base} border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200`}>
          <span aria-hidden>🔵</span>
          Processing <span className="font-normal text-muted-foreground">(Đang lập chỉ mục)</span>
        </span>
      );
    case 'completed':
      return (
        <span className={`${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200`}>
          <span aria-hidden>🟢</span>
          Completed <span className="font-normal text-muted-foreground">(Hoàn tất)</span>
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} border-destructive/40 bg-destructive/10 text-destructive`}>
          <span aria-hidden>🔴</span>
          Failed <span className="font-normal opacity-90">(Lỗi)</span>
        </span>
      );
    default:
      return (
        <span className={`${base} border-border bg-muted text-muted-foreground`}>
          {statusRaw?.trim() || 'Unknown'}
        </span>
      );
  }
}

type Props = {
  doc: DocumentDto;
  statusDetail?: DocumentStatusResponse | null;
};

export function DocumentIndexingCell({ doc, statusDetail }: Props) {
  const n = normalizeIndexingStatus(doc.indexingStatus);
  if (n !== 'processing') {
    return <StaticIndexingBadge statusRaw={doc.indexingStatus} />;
  }

  const pctRaw =
    statusDetail?.progressPercentage ?? doc.indexingProgressPercentage ?? 0;
  const pct = Math.min(100, Math.max(0, Math.round(pctRaw)));
  const cur = statusDetail?.currentPageIndexing ?? doc.currentPageIndexing;
  const total = statusDetail?.totalPages ?? doc.totalPages;
  const curLabel = cur != null && cur > 0 ? String(cur) : '—';
  const totalLabel = total != null && total > 0 ? String(total) : '—';

  return (
    <div className="min-w-[220px] max-w-[min(100%,320px)] space-y-2">
      <p className="text-[11px] font-medium leading-snug text-sky-900 dark:text-sky-100">
        Đang xử lý: Trang {curLabel}/{totalLabel} ({pct}%)
      </p>
      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-sky-500/15 ring-1 ring-sky-500/20"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
      </div>
      {statusDetail?.currentOperation ? (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{statusDetail.currentOperation}</p>
      ) : null}
    </div>
  );
}
