'use client';

import type { NormalizedPolygonPoint } from '@/lib/api/types';

/**
 * Renders student / expert ROI as an SVG overlay in normalized image coordinates (0–1).
 */
function sanitizeRing(pts: NormalizedPolygonPoint[] | null | undefined): NormalizedPolygonPoint[] {
  if (!pts || !Array.isArray(pts)) return [];
  return pts.filter(
    (p) =>
      p &&
      typeof p === 'object' &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y),
  );
}

export function PolygonAnnotationOverlay({
  closed,
  draft,
  label = 'ROI',
  className = '',
}: {
  closed: NormalizedPolygonPoint[] | null;
  draft: NormalizedPolygonPoint[];
  label?: string;
  className?: string;
}) {
  const ptsAttr = (pts: NormalizedPolygonPoint[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  const closedClean = sanitizeRing(closed);
  const draftClean = sanitizeRing(draft);

  const showDraft = draftClean.length > 0;
  const showClosed = closedClean.length >= 3;

  if (!showDraft && !showClosed) return null;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`.trim()}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-label={label}
      role="img"
    >
      {showClosed ? (
        <polygon
          points={ptsAttr(closedClean)}
          fill="rgba(239, 68, 68, 0.2)"
          stroke="rgb(239, 68, 68)"
          strokeWidth={0.004}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {showDraft ? (
        <>
          {draftClean.length >= 2 ? (
            <polyline
              points={ptsAttr(draftClean)}
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth={0.003}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {draftClean.map((p, i) => (
            <circle
              key={`${p.x}-${p.y}-${i}`}
              cx={p.x}
              cy={p.y}
              r={i === 0 && draft.length >= 3 ? 0.012 : 0.007}
              fill={i === 0 && draft.length >= 3 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.85)'}
              stroke="rgb(185, 28, 28)"
              strokeWidth={0.0015}
            />
          ))}
        </>
      ) : null}
    </svg>
  );
}
