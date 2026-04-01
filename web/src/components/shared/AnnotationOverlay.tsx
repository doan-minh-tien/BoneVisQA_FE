import type { PercentageBoundingBox } from '@/lib/api/types';
import { isValidPercentageBoundingBox } from '@/lib/utils/annotations';

export function AnnotationOverlay({
  box,
  label = 'ANNOTATION',
  className = '',
}: {
  box: PercentageBoundingBox | null | undefined;
  label?: string;
  className?: string;
}) {
  if (!isValidPercentageBoundingBox(box)) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute rounded-xl border-2 shadow-[0_0_22px_rgba(0,229,255,0.35)] ${className}`.trim()}
      style={{
        left: `${box.xPct}%`,
        top: `${box.yPct}%`,
        width: `${box.widthPct}%`,
        height: `${box.heightPct}%`,
      }}
    >
      {label ? (
        <span className="absolute -top-3 left-3 rounded-full border bg-black/90 px-3 py-1 text-[10px] font-semibold tracking-[0.22em]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
