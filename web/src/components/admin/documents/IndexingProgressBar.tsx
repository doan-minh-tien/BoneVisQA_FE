'use client';

import { normalizeIndexingStatus, type NormalizedIndexingStatus } from '@/lib/api/admin-documents';

type Props = {
  statusRaw?: string;
  currentPageIndexing?: number | null;
  totalPages?: number | null;
  totalChunks?: number | null;
  currentOperation?: string | null;
  className?: string;
};

type ProgressState = {
  normalizedStatus: NormalizedIndexingStatus;
  current: number;
  total: number;
  unit: 'page' | 'chunk';
  percent: number;
  isIndeterminate: boolean;
  label: string;
  helper: string;
};

function toNonNegativeInt(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  return Math.floor(value);
}

function buildProgressState(
  statusRaw: string | undefined,
  currentPageIndexing: number | null | undefined,
  totalPages: number | null | undefined,
  totalChunks: number | null | undefined,
): ProgressState {
  const statusText = (statusRaw ?? '').trim().toLowerCase();
  const isReindexing = statusText.includes('reindex');
  const normalizedStatus = normalizeIndexingStatus(statusRaw);
  const current = toNonNegativeInt(currentPageIndexing);
  const totalPagesInt = toNonNegativeInt(totalPages);
  const totalChunksInt = toNonNegativeInt(totalChunks);
  const total = totalPagesInt > 0 ? totalPagesInt : totalChunksInt;
  const unit: 'page' | 'chunk' = totalPagesInt > 0 ? 'page' : 'chunk';
  const isActive = normalizedStatus === 'pending' || normalizedStatus === 'processing';
  const isIndeterminate = isActive && total <= 0;

  if (isIndeterminate) {
    return {
      normalizedStatus,
      current,
      total,
      unit,
      percent: 0,
      isIndeterminate: true,
      label:
        normalizedStatus === 'pending'
          ? isReindexing
            ? 'Re-analyzing Document...'
            : 'Analyzing PDF...'
          : isReindexing
            ? 'Re-vectorizing Content...'
            : 'Extracting data...',
      helper: isReindexing ? 'Reindexing' : normalizedStatus === 'pending' ? 'Pending' : 'Processing',
    };
  }

  // Strict formula: (currentPageIndexing / totalPages) * 100
  const raw = total > 0 ? (current / total) * 100 : 0;
  const safe = Number.isFinite(raw) ? raw : 0;
  const percent = Math.min(100, Math.max(0, Math.round(safe)));

  return {
    normalizedStatus,
    current,
    total,
    unit,
    percent,
    isIndeterminate: false,
    label: `${isReindexing ? 'Reindexing' : 'Processing'}: ${
      unit === 'page' ? 'Page' : 'Chunk'
    } ${current || '—'} / ${total || '—'} (${percent}%)`,
    helper: isReindexing ? 'Reindexing' : normalizedStatus === 'pending' ? 'Pending' : 'Processing',
  };
}

export function IndexingProgressBar({
  statusRaw,
  currentPageIndexing,
  totalPages,
  totalChunks,
  currentOperation,
  className,
}: Props) {
  const state = buildProgressState(statusRaw, currentPageIndexing, totalPages, totalChunks);

  return (
    <div className={`space-y-2 ${className ?? ''}`.trim()}>
      <p className="text-[11px] font-medium leading-snug text-sky-900">{state.label}</p>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-sky-500/15 ring-1 ring-sky-500/20">
        {state.isIndeterminate ? (
          <div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 animate-[indeterminate-slide_1.2s_ease-in-out_infinite]"
            aria-hidden
          />
        ) : (
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400"
            style={{ width: `${state.percent}%`, transition: 'width 0.3s ease-in-out' }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
      </div>
      {currentOperation?.trim() ? (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{currentOperation}</p>
      ) : (
        <p className="text-[10px] text-muted-foreground">{state.helper}</p>
      )}
    </div>
  );
}
