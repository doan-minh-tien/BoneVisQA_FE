import type { NormalizedIndexingStatus } from '@/lib/api/admin-documents';

export type IndexingPhaseKey = 'download' | 'parsing' | 'vectorizing';

export type PhaseBarsModel = {
  downloadPct: number;
  parsingPct: number;
  vectorizingPct: number;
  failedPhase: IndexingPhaseKey | null;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Guess which pipeline bar failed from backend hints (embedding vs parsing vs IO). */
export function inferFailedPhase(operation?: string, phaseHint?: string): IndexingPhaseKey {
  const op = (operation ?? '').toLowerCase();
  const ph = (phaseHint ?? '').toLowerCase();
  if (ph.includes('download') || ph.includes('load') || ph.includes('storage')) return 'download';
  if (ph.includes('pars') || ph.includes('pdf')) return 'parsing';
  if (ph.includes('vector') || ph.includes('embed')) return 'vectorizing';
  if (/embed|vector|openai|huggingface|chunk|diskann|pinecone/.test(op)) return 'vectorizing';
  if (/pig|pdf|parse|extract|page|ocr/.test(op)) return 'parsing';
  if (/download|load|storage|blob|fetch|read/.test(op)) return 'download';
  return 'vectorizing';
}

/**
 * Map REST + SignalR fields into three stable progress bars (Download → PdfPig → Vectorize).
 * Uses the same counters the API already exposes (`currentPageIndexing` across page vs chunk stages).
 */
export function computePhaseBars(args: {
  normalized: NormalizedIndexingStatus;
  operation?: string;
  phaseHint?: string;
  totalPages?: number;
  totalChunks?: number;
  currentPageIndexing?: number;
  progressPercentage?: number;
}): PhaseBarsModel {
  const {
    normalized,
    operation,
    phaseHint,
    totalPages = 0,
    totalChunks = 0,
    currentPageIndexing = 0,
    progressPercentage = 0,
  } = args;

  const op = (operation ?? '').toLowerCase();
  const vectorizingSignals = /vector|embed|chunk|openai|huggingface|embedding/.test(op);

  if (normalized === 'completed') {
    return {
      downloadPct: 100,
      parsingPct: 100,
      vectorizingPct: 100,
      failedPhase: null,
    };
  }

  if (normalized === 'unknown') {
    return {
      downloadPct: 12,
      parsingPct: 0,
      vectorizingPct: 0,
      failedPhase: null,
    };
  }

  const cur = Math.max(0, Math.floor(currentPageIndexing));

  if (normalized === 'failed') {
    const failedPhase = inferFailedPhase(operation, phaseHint);
    const partial = computePhaseBars({
      normalized: 'processing',
      operation,
      phaseHint,
      totalPages,
      totalChunks,
      currentPageIndexing,
      progressPercentage,
    });
    return { ...partial, failedPhase };
  }

  const pagesReady = totalPages > 0;
  const chunksReady = totalChunks > 0;

  let downloadPct = 0;
  let parsingPct = 0;
  let vectorizingPct = 0;

  if (!pagesReady) {
    downloadPct =
      normalized === 'pending'
        ? 28
        : normalized === 'processing'
          ? 55
          : clampPct(progressPercentage * 0.35);
    parsingPct = 0;
    vectorizingPct = 0;
  } else if (!chunksReady && !vectorizingSignals) {
    downloadPct = 100;
    parsingPct = clampPct((cur / totalPages) * 100);
    vectorizingPct = 0;
  } else {
    downloadPct = 100;
    parsingPct = 100;
    if (chunksReady) {
      vectorizingPct = clampPct((cur / totalChunks) * 100);
    } else {
      vectorizingPct = clampPct(progressPercentage);
    }
  }

  return {
    downloadPct,
    parsingPct,
    vectorizingPct,
    failedPhase: null,
  };
}
