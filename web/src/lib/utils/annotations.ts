import type { NormalizedPolygonPoint, PercentageBoundingBox } from '@/lib/api/types';

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

const EPS = 1e-6;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function isValidPolygon(
  points: NormalizedPolygonPoint[] | null | undefined,
): points is NormalizedPolygonPoint[] {
  if (!points || points.length < 3) return false;
  return points.every(
    (p) =>
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      p.x >= -EPS &&
      p.x <= 1 + EPS &&
      p.y >= -EPS &&
      p.y <= 1 + EPS,
  );
}

function normalizeVertex(raw: unknown): NormalizedPolygonPoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  let x = Number(o.x);
  let y = Number(o.y);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  if (x > 1 + EPS || y > 1 + EPS) {
    x /= 100;
    y /= 100;
  }
  return { x: clamp01(x), y: clamp01(y) };
}

export function parseCustomPolygon(raw: unknown): NormalizedPolygonPoint[] | null {
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
  if (!Array.isArray(source)) return null;
  const out: NormalizedPolygonPoint[] = [];
  for (const row of source) {
    const v = normalizeVertex(row);
    if (v) out.push(v);
  }
  return isValidPolygon(out) ? out.map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) })) : null;
}

export function serializeCustomPolygon(
  points: NormalizedPolygonPoint[] | null | undefined,
): string | null {
  if (!points || points.length < 3) return null;
  const normalized = points.map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) }));
  if (normalized.length < 3) return null;
  return JSON.stringify(normalized);
}
