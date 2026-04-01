'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Pencil, RefreshCcw, ScanSearch, ZoomIn, ZoomOut } from 'lucide-react';
import { AnnotationOverlay } from '@/components/shared/AnnotationOverlay';
import { Button } from '@/components/ui/button';
import type { PercentageBoundingBox } from '@/lib/api/types';
import {
  buildPercentageBoundingBox,
  isValidPercentageBoundingBox,
} from '@/lib/utils/annotations';

const MIN = 0.5;
const MAX = 4;

export function MedicalImageViewer({
  src,
  alt,
  onAnnotationComplete,
}: {
  src: string | null;
  alt: string;
  onAnnotationComplete?: (box: PercentageBoundingBox) => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [boundingBox, setBoundingBox] = useState<PercentageBoundingBox | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const drag = useRef(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const latestBoundingBox = useRef<PercentageBoundingBox | null>(null);
  const start = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
    setBoundingBox(null);
    latestBoundingBox.current = null;
    drawStart.current = null;
    onAnnotationComplete?.({ xPct: 0, yPct: 0, widthPct: 0, heightPct: 0 });
  };

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const localX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const localY = Math.min(Math.max(clientY - rect.top, 0), rect.height);

    return {
      x: localX,
      y: localY,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const finalizeAnnotation = useCallback(() => {
    drawStart.current = null;
    const box = latestBoundingBox.current;
    if (isValidPercentageBoundingBox(box)) {
      onAnnotationComplete?.(box);
    }
  }, [onAnnotationComplete]);

  useEffect(() => {
    latestBoundingBox.current = boundingBox;
  }, [boundingBox]);

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
        className="relative flex-1 cursor-grab overflow-hidden bg-black active:cursor-grabbing"
        style={{ cursor: isDrawMode ? 'crosshair' : undefined }}
        onMouseDown={(e) => {
          if (isDrawMode) {
            const point = getRelativePoint(e.clientX, e.clientY);
            if (!point) return;
            drawStart.current = { x: point.x, y: point.y };
            const nextBox = buildPercentageBoundingBox(drawStart.current, point);
            latestBoundingBox.current = nextBox;
            setBoundingBox(nextBox);
            return;
          }

          drag.current = true;
          setIsDragging(true);
          start.current = { x: e.clientX, y: e.clientY, tx, ty };
        }}
        onMouseMove={(e) => {
          if (isDrawMode) {
            if (!drawStart.current) return;
            const point = getRelativePoint(e.clientX, e.clientY);
            if (!point) return;

            const nextBox = buildPercentageBoundingBox(drawStart.current, point);
            latestBoundingBox.current = nextBox;
            setBoundingBox(nextBox);
            return;
          }

          if (!drag.current) return;
          setTx(start.current.tx + (e.clientX - start.current.x));
          setTy(start.current.ty + (e.clientY - start.current.y));
        }}
        onMouseUp={() => {
          if (isDrawMode) {
            finalizeAnnotation();
            return;
          }
          drag.current = false;
          setIsDragging(false);
        }}
        onMouseLeave={() => {
          if (isDrawMode) {
            finalizeAnnotation();
            return;
          }
          drag.current = false;
          setIsDragging(false);
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_58%)]" />
        <div
          className="flex h-full w-full items-center justify-center p-4"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 80ms ease-out',
          }}
        >
          <div
            className="relative"
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
            <AnnotationOverlay
              box={boundingBox}
              label="ANNOTATION"
              className="border-cyan-accent text-cyan-accent"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-cyan-accent/20 bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted backdrop-blur">
          Radiograph viewer
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-color bg-surface/85 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
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
            aria-label="Annotate"
            onClick={() => setIsDrawMode(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!rounded-full !px-2.5 !py-2 text-text-main"
            onClick={reset}
            aria-label="Reset viewer"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="border-t border-border-color bg-black px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">
        Scroll to zoom · Drag to pan or annotate · Educational preview only — not for diagnostic use
      </p>
    </div>
  );
}
