'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Hand, Pencil, RefreshCcw, ScanSearch, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { PolygonAnnotationOverlay } from '@/components/shared/PolygonAnnotationOverlay';
import { Button } from '@/components/ui/button';
import type { NormalizedPolygonPoint } from '@/lib/api/types';
import { isValidPolygon } from '@/lib/utils/annotations';

const MIN = 0.5;
const MAX = 4;
const SNAP_TO_CLOSE_PX = 14;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function nearFirstVertex(
  first: NormalizedPolygonPoint,
  p: NormalizedPolygonPoint,
  imgWidth: number,
  imgHeight: number,
): boolean {
  const dx = (p.x - first.x) * imgWidth;
  const dy = (p.y - first.y) * imgHeight;
  return Math.hypot(dx, dy) < SNAP_TO_CLOSE_PX;
}

export function MedicalImageViewer({
  src,
  alt,
  initialPolygon,
  onAnnotationComplete,
}: {
  src: string | null;
  alt: string;
  /** Restored draft polygon from persistence (normalized 0–1 vertices). */
  initialPolygon?: NormalizedPolygonPoint[] | null;
  onAnnotationComplete?: (polygon: NormalizedPolygonPoint[] | null) => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draftPoints, setDraftPoints] = useState<NormalizedPolygonPoint[]>([]);
  const [closedPolygon, setClosedPolygon] = useState<NormalizedPolygonPoint[] | null>(() =>
    initialPolygon && isValidPolygon(initialPolygon) ? initialPolygon : null,
  );
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const drag = useRef(false);
  const start = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const draftRef = useRef<NormalizedPolygonPoint[]>([]);
  const closedRef = useRef<NormalizedPolygonPoint[] | null>(null);
  useEffect(() => {
    draftRef.current = draftPoints;
  }, [draftPoints]);

  useEffect(() => {
    closedRef.current = closedPolygon;
  }, [closedPolygon]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((current) => {
        const next = current + (e.deltaY > 0 ? -0.12 : 0.12);
        return Math.min(MAX, Math.max(MIN, next));
      });
    };

    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getNormalizedPoint = useCallback((clientX: number, clientY: number) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const lx = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ly = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    return { x: lx / rect.width, y: ly / rect.height };
  }, []);

  const finalizePolygon = useCallback(
    (pts: NormalizedPolygonPoint[]) => {
      const normalized = pts.map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) }));
      if (!isValidPolygon(normalized)) return;
      setClosedPolygon(normalized);
      setDraftPoints([]);
      onAnnotationComplete?.(normalized);
    },
    [onAnnotationComplete],
  );

  const clearAnnotation = useCallback(() => {
    setDraftPoints([]);
    setClosedPolygon(null);
    onAnnotationComplete?.(null);
  }, [onAnnotationComplete]);

  const undoLastVertex = useCallback(() => {
    setDraftPoints((prev) => prev.slice(0, -1));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
    clearAnnotation();
  }, [clearAnnotation]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawMode) return;
      e.stopPropagation();
      if (e.detail === 2) {
        const d = draftRef.current;
        if (d.length >= 3) {
          finalizePolygon(d);
        }
        return;
      }
      const p = getNormalizedPoint(e.clientX, e.clientY);
      if (!p) return;

      const rect = imgRef.current?.getBoundingClientRect();
      const w = rect?.width ?? 1;
      const h = rect?.height ?? 1;
      const currentDraft = draftRef.current;
      const hasClosed = closedRef.current;

      if (hasClosed) {
        setClosedPolygon(null);
        onAnnotationComplete?.(null);
        setDraftPoints([p]);
        return;
      }

      if (currentDraft.length >= 3 && nearFirstVertex(currentDraft[0], p, w, h)) {
        finalizePolygon(currentDraft);
        return;
      }

      setDraftPoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dx = (p.x - last.x) * w;
          const dy = (p.y - last.y) * h;
          if (Math.hypot(dx, dy) < 4) return prev;
        }
        return [...prev, p];
      });
    },
    [finalizePolygon, getNormalizedPoint, isDrawMode, onAnnotationComplete],
  );

  const handleEndDraw = useCallback(() => {
    const d = draftRef.current;
    if (d.length >= 3) {
      finalizePolygon(d);
    }
  }, [finalizePolygon]);

  if (!src) {
    return (
      <div className="relative flex h-full min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-none bg-black p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_55%)]" />
        <ScanSearch className="relative mb-3 h-12 w-12 text-cyan-accent/70" />
        <p className="relative text-sm font-medium text-text-main">Radiograph viewer idle</p>
        <p className="relative mt-1 max-w-xs text-xs text-text-muted">
          Upload a DICOM, X-ray, CT, or MRI to inspect the study in the diagnostic viewport.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-none bg-black shadow-panel">
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-black"
        style={{ cursor: isDrawMode ? 'default' : undefined }}
      >
        <div
          className={`relative flex h-full w-full items-center justify-center p-4 ${
            !isDrawMode ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 80ms ease-out',
          }}
          onMouseDown={(e) => {
            if (isDrawMode) return;
            drag.current = true;
            setIsDragging(true);
            start.current = { x: e.clientX, y: e.clientY, tx, ty };
          }}
          onMouseMove={(e) => {
            if (!drag.current || isDrawMode) return;
            setTx(start.current.tx + (e.clientX - start.current.x));
            setTy(start.current.ty + (e.clientY - start.current.y));
          }}
          onMouseUp={() => {
            drag.current = false;
            setIsDragging(false);
          }}
          onMouseLeave={() => {
            drag.current = false;
            setIsDragging(false);
          }}
        >
          <div
            className="relative inline-block max-h-full max-w-full"
            style={{
              width: imageSize.width ? `${imageSize.width}px` : undefined,
              height: imageSize.height ? `${imageSize.height}px` : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
              onLoad={() => {
                if (!imgRef.current) return;
                setImageSize({
                  width: imgRef.current.clientWidth,
                  height: imgRef.current.clientHeight,
                });
              }}
            />
            <PolygonAnnotationOverlay
              closed={closedPolygon}
              draft={draftPoints}
              label="LESION ROI"
            />
            {isDrawMode ? (
              <div
                role="presentation"
                className="absolute inset-0 z-20 cursor-crosshair bg-transparent"
                aria-hidden
                onClick={handleImageClick}
              />
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-cyan-accent/20 bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted backdrop-blur">
          Radiograph viewer
        </div>

        <div className="absolute bottom-5 left-1/2 flex max-w-[min(100vw-2rem,42rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-full border border-border-color bg-surface/90 px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur sm:gap-2 sm:px-3">
          <Button
            type="button"
            variant="ghost"
            className="!rounded-full !px-2.5 !py-2 text-text-main"
            onClick={() => setScale((s) => Math.min(MAX, s + 0.15))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!rounded-full !px-2.5 !py-2 text-text-main"
            onClick={() => setScale((s) => Math.max(MIN, s - 0.15))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`!rounded-full !px-2.5 !py-2 ${!isDrawMode ? 'bg-cyan-accent/10 text-cyan-accent' : 'text-text-main'}`}
            aria-label="Pan"
            onClick={() => setIsDrawMode(false)}
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`!rounded-full !px-2.5 !py-2 ${isDrawMode ? 'bg-cyan-accent/10 text-cyan-accent' : 'text-text-main'}`}
            aria-label="Polygon annotate"
            onClick={() => setIsDrawMode(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isDrawMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className="!rounded-full !px-2.5 !py-2 text-text-main disabled:opacity-40"
                aria-label="Undo last vertex"
                disabled={draftPoints.length === 0}
                onClick={undoLastVertex}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="!rounded-full !px-2.5 !py-2 text-amber-200/90"
                aria-label="Clear annotation"
                onClick={clearAnnotation}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="!rounded-full !px-2.5 !py-2 text-xs font-semibold text-red-300"
                disabled={draftPoints.length < 3}
                onClick={handleEndDraw}
              >
                End draw
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="!rounded-full !px-2.5 !py-2 text-text-main"
            onClick={resetView}
            aria-label="Reset viewer"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="border-t border-border-color bg-black px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">
        Scroll to zoom · Polygon: click vertices, double-click or End draw to close, or click near the first point ·
        Educational preview only
      </p>
    </div>
  );
}
