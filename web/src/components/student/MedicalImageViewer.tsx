'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Hand, RefreshCcw, ScanSearch, Square, ZoomIn, ZoomOut } from 'lucide-react';
import { RectangleAnnotationOverlay } from '@/components/shared/RectangleAnnotationOverlay';
import { Button } from '@/components/ui/button';
import type { NormalizedImageBoundingBox } from '@/lib/api/types';
import {
  cornersNormalizedToBox,
  cornersNormalizedToDraftBox,
  isValidNormalizedBoundingBox,
  normalizeClientPointFromRect,
} from '@/lib/utils/annotations';

const MIN = 0.5;
const MAX = 4;

export function MedicalImageViewer({
  src,
  alt,
  initialAnnotation,
  onAnnotationComplete,
}: {
  src: string | null;
  alt: string;
  /** Restored draft ROI (normalized bounding box). */
  initialAnnotation?: NormalizedImageBoundingBox | null;
  onAnnotationComplete?: (box: NormalizedImageBoundingBox | null) => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [closedBox, setClosedBox] = useState<NormalizedImageBoundingBox | null>(() =>
    initialAnnotation && isValidNormalizedBoundingBox(initialAnnotation) ? initialAnnotation : null,
  );
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const drag = useRef(false);
  const start = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drawLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialAnnotation === undefined) return;
    if (initialAnnotation === null) {
      setClosedBox(null);
      return;
    }
    if (isValidNormalizedBoundingBox(initialAnnotation)) {
      setClosedBox(initialAnnotation);
    }
  }, [initialAnnotation]);

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
    const rect = drawLayerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return normalizeClientPointFromRect(clientX, clientY, rect);
  }, []);

  const draftBox =
    drawStart && drawCurrent ? cornersNormalizedToDraftBox(drawStart, drawCurrent) : null;

  const clearAnnotation = useCallback(() => {
    setClosedBox(null);
    setDrawStart(null);
    setDrawCurrent(null);
    onAnnotationComplete?.(null);
  }, [onAnnotationComplete]);

  const resetView = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
    clearAnnotation();
  }, [clearAnnotation]);

  const handleDrawMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawMode) return;
      e.preventDefault();
      e.stopPropagation();
      const startPt = getNormalizedPoint(e.clientX, e.clientY);
      if (!startPt) return;
      if (closedBox) {
        clearAnnotation();
      }
      setDrawStart(startPt);
      setDrawCurrent(startPt);

      const onMove = (ev: MouseEvent) => {
        const q = getNormalizedPoint(ev.clientX, ev.clientY);
        if (q) setDrawCurrent(q);
      };

      const onUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const end = getNormalizedPoint(ev.clientX, ev.clientY) ?? startPt;
        setDrawStart(null);
        setDrawCurrent(null);
        const box = cornersNormalizedToBox(startPt, end);
        if (box) {
          setClosedBox(box);
          onAnnotationComplete?.(box);
        }
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [clearAnnotation, closedBox, getNormalizedPoint, isDrawMode, onAnnotationComplete],
  );

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
        style={{ cursor: isDrawMode ? undefined : undefined }}
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
            <RectangleAnnotationOverlay closed={closedBox} draft={draftBox} label="LESION ROI" />
            {isDrawMode ? (
              <div
                ref={drawLayerRef}
                role="presentation"
                className="absolute inset-0 z-20 cursor-crosshair bg-transparent"
                aria-hidden
                onMouseDown={handleDrawMouseDown}
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
            aria-label="Draw rectangle ROI"
            onClick={() => setIsDrawMode(true)}
          >
            <Square className="h-4 w-4" />
          </Button>
          {isDrawMode ? (
            <Button
              type="button"
              variant="ghost"
              className="!rounded-full !px-2.5 !py-2 text-amber-200/90"
              aria-label="Clear annotation"
              onClick={clearAnnotation}
            >
              <Eraser className="h-4 w-4" />
            </Button>
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
        Scroll to zoom · Rectangle ROI: select square tool, click-drag on the image, release to commit (normalized x,
        y, width, height) · Educational preview only
      </p>
    </div>
  );
}
