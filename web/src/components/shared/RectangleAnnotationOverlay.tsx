'use client';

import type { NormalizedImageBoundingBox } from '@/lib/api/types';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';

/**
 * ROI as a normalized axis-aligned rectangle (`viewBox="0 0 1 1"`).
 */
function finiteBox(
  b: NormalizedImageBoundingBox | null | undefined,
): NormalizedImageBoundingBox | null {
  if (!b || typeof b !== 'object') return null;
  const x = Number(b.x);
  const y = Number(b.y);
  const w = Number(b.width);
  const h = Number(b.height);
  if (![x, y, w, h].every((n) => Number.isFinite(n))) return null;
  return { x, y, width: w, height: h };
}

export function RectangleAnnotationOverlay({
  closed,
  draft,
  label = 'ROI',
  className = '',
}: {
  closed: NormalizedImageBoundingBox | null;
  /** Rubber-band while dragging (normalized, may be smaller than commit threshold). */
  draft: NormalizedImageBoundingBox | null;
  label?: string;
  className?: string;
}) {
  const closedSafe = finiteBox(closed);
  const draftSafe = finiteBox(draft);
  const showClosed = Boolean(closedSafe && isValidNormalizedBoundingBox(closedSafe));
  const showDraft = Boolean(
    draftSafe &&
      draftSafe.width > 1e-6 &&
      draftSafe.height > 1e-6 &&
      !(
        showClosed &&
        closedSafe &&
        draftSafe.x === closedSafe.x &&
        draftSafe.y === closedSafe.y &&
        draftSafe.width === closedSafe.width &&
        draftSafe.height === closedSafe.height
      ),
  );

  if (!showClosed && !showDraft) return null;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`.trim()}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-label={label}
      role="img"
    >
      {showClosed && closedSafe ? (
        <rect
          x={closedSafe.x}
          y={closedSafe.y}
          width={closedSafe.width}
          height={closedSafe.height}
          fill="rgba(239, 68, 68, 0.18)"
          stroke="rgb(239, 68, 68)"
          strokeWidth={0.004}
        />
      ) : null}
      {showDraft && draftSafe ? (
        <rect
          x={draftSafe.x}
          y={draftSafe.y}
          width={draftSafe.width}
          height={draftSafe.height}
          fill="rgba(239, 68, 68, 0.08)"
          stroke="rgb(239, 68, 68)"
          strokeWidth={0.003}
          strokeDasharray="0.012 0.008"
        />
      ) : null}
    </svg>
  );
}
