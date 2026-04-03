import type { PercentageBoundingBox } from '@/lib/api/types';

type PixelPoint = {
  x: number;
  y: number;
};

type PixelBounds = PixelPoint & {
  width: number;
  height: number;
};

export function clampAnnotationPercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

export function isValidPercentageBoundingBox(
  box: PercentageBoundingBox | null | undefined,
): box is PercentageBoundingBox {
  return Boolean(
    box &&
      box.widthPct > 0 &&
      box.heightPct > 0 &&
      box.xPct >= 0 &&
      box.yPct >= 0 &&
      box.xPct + box.widthPct <= 100 &&
      box.yPct + box.heightPct <= 100,
  );
}

export function clampPercentageBoundingBox(
  box: PercentageBoundingBox,
): PercentageBoundingBox | null {
  const xPct = clampAnnotationPercent(box.xPct);
  const yPct = clampAnnotationPercent(box.yPct);
  const widthPct = clampAnnotationPercent(Math.min(box.widthPct, 100 - xPct));
  const heightPct = clampAnnotationPercent(Math.min(box.heightPct, 100 - yPct));

  if (widthPct <= 0 || heightPct <= 0) {
    return null;
  }

  return { xPct, yPct, widthPct, heightPct };
}

export function parsePercentageBoundingBox(raw: unknown): PercentageBoundingBox | null {
  if (!raw) return null;

  let source: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      source = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!source || typeof source !== 'object') return null;
  const candidate = source as Record<string, unknown>;
  const parsed = {
    xPct: Number(candidate.xPct),
    yPct: Number(candidate.yPct),
    widthPct: Number(candidate.widthPct),
    heightPct: Number(candidate.heightPct),
  };

  if (Object.values(parsed).some((value) => Number.isNaN(value))) {
    return null;
  }

  return clampPercentageBoundingBox(parsed);
}

export function serializePercentageBoundingBox(
  box: PercentageBoundingBox | null | undefined,
): string | null {
  if (!box) return null;
  const normalized = clampPercentageBoundingBox(box);
  if (!normalized) return null;
  return JSON.stringify(normalized);
}

export function buildPercentageBoundingBox(
  startPoint: PixelPoint,
  endPoint: PixelBounds,
): PercentageBoundingBox {
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  const xPct = endPoint.width <= 0 ? 0 : clampAnnotationPercent((left / endPoint.width) * 100);
  const yPct = endPoint.height <= 0 ? 0 : clampAnnotationPercent((top / endPoint.height) * 100);
  const widthPct =
    endPoint.width <= 0
      ? 0
      : clampAnnotationPercent(Math.min((width / endPoint.width) * 100, 100 - xPct));
  const heightPct =
    endPoint.height <= 0
      ? 0
      : clampAnnotationPercent(Math.min((height / endPoint.height) * 100, 100 - yPct));

  return {
    xPct,
    yPct,
    widthPct,
    heightPct,
  };
}
