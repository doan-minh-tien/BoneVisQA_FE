'use client';

import type { NormalizedPolygonPoint } from '@/lib/api/types';

/**
 * Renders student / expert ROI as an SVG overlay in normalized image coordinates (0–1).
 */
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

  const showDraft = draft.length > 0;
  const showClosed = closed && closed.length >= 3;

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
          points={ptsAttr(closed!)}
          fill="rgba(239, 68, 68, 0.2)"
          stroke="rgb(239, 68, 68)"
          strokeWidth={0.004}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {showDraft ? (
        <>
          {draft.length >= 2 ? (
            <polyline
              points={ptsAttr(draft)}
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth={0.003}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {draft.map((p, i) => (
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
