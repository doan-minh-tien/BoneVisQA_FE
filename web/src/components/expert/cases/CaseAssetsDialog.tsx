'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import {
  createExpertImage,
  createExpertAnnotation,
  createExpertCaseTag,
  fetchExpertTags,
  fetchExpertImages,
  fetchExpertAnnotations,
  type ExpertTag,
  type ExpertImageDto,
  type ExpertAnnotationDto,
} from '@/lib/api/expert-cases';
import { getPublicApiOrigin } from '@/lib/api/client';
import type { NormalizedImageBoundingBox } from '@/lib/api/types';
import { RectangleAnnotationOverlay } from '@/components/shared/RectangleAnnotationOverlay';
import {
  cornersNormalizedToBox,
  cornersNormalizedToDraftBox,
  normalizeClientPointFromRect,
  serializeNormalizedBoundingBox,
} from '@/lib/utils/annotations';

interface CaseAssetsDialogProps {
  caseId: string;
  mode: 'tags' | 'annotation';
  onClose: () => void;
  /** Lets experts switch between tags and images/annotations in one modal (e.g. after creating a case). */
  allowModeSwitch?: boolean;
}

export default function CaseAssetsDialog({ caseId, mode, onClose, allowModeSwitch }: CaseAssetsDialogProps) {
  const toast = useToast();
  const [isMutating, setIsMutating] = useState(false);

  // ── Image upload ──────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modality, setModality] = useState('MRI');
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  // ── Annotation form ───────────────────────────────────────────────────────
  const [annotImageId, setAnnotImageId] = useState('');
  const [label, setLabel] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [committedBox, setCommittedBox] = useState<NormalizedImageBoundingBox | null>(null);
  const drawLayerRef = useRef<HTMLDivElement | null>(null);

  // ── Tag form ──────────────────────────────────────────────────────────────
  const [tagId, setTagId] = useState('');

  // ── Options / data ────────────────────────────────────────────────────────
  const [tagsList, setTagsList] = useState<ExpertTag[]>([]);
  const [imagesList, setImagesList] = useState<ExpertImageDto[]>([]);
  const [annotationsList, setAnnotationsList] = useState<ExpertAnnotationDto[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [activeMode, setActiveMode] = useState<'tags' | 'annotation'>(mode);

  const effectiveMode = allowModeSwitch ? activeMode : mode;

  useEffect(() => {
    setActiveMode(mode);
  }, [mode, caseId]);

  // Build a merged map of all available images (from /images + from /annotation imageUrls)
  const allImageOptions = (() => {
    const map = new Map<string, { id: string; label: string; imageUrl: string }>();
    // Images from the images endpoint
    imagesList.forEach((img) => {
      map.set(img.id, { id: img.id, label: img.fileName || img.id, imageUrl: img.imageUrl });
    });
    // Images referenced by existing annotations (may not overlap)
    annotationsList.forEach((ann) => {
      if (!map.has(ann.id)) {
        map.set(ann.id, { id: ann.id, label: ann.label || ann.id, imageUrl: ann.imageUrl });
      }
    });
    return Array.from(map.values());
  })();

  const selectedImageUrl =
    allImageOptions.find((opt) => opt.id === annotImageId)?.imageUrl ||
    annotationsList.find((a) => a.id === annotImageId)?.imageUrl ||
    imagesList.find((img) => img.id === annotImageId)?.imageUrl;

  // Resolve full URL if it is a relative path
  const resolvedImageUrl = selectedImageUrl
    ? selectedImageUrl.startsWith('http')
      ? selectedImageUrl
      : `${getPublicApiOrigin()}${selectedImageUrl.startsWith('/') ? '' : '/'}${selectedImageUrl}`
    : null;

  useEffect(() => {
    if (effectiveMode === 'tags') {
      fetchExpertTags(1, 100)
        .then(setTagsList)
        .catch((e) => console.error('fetch tags failed', e));
    }

    if (effectiveMode === 'annotation') {
      setIsLoadingImages(true);
      Promise.all([
        fetchExpertImages(1, 100).catch(() => [] as ExpertImageDto[]),
        fetchExpertAnnotations(1, 100).catch(() => ({ items: [] as ExpertAnnotationDto[], totalCount: 0, pageIndex: 1, pageSize: 100 })),
      ])
        .then(([imgs, annotRes]) => {
          setImagesList(imgs);
          setAnnotationsList(annotRes.items);
          // Auto-select first annotation image if available
          if (annotRes.items.length > 0 && !annotImageId) {
            setAnnotImageId(annotRes.items[0].id);
          }
        })
        .finally(() => setIsLoadingImages(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMode, caseId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUploadImage = async () => {
    if (!imageFile) return toast.error('Please select an image file');
    setIsMutating(true);
    try {
      const formData = new FormData();
      formData.append('CaseId', caseId);
      formData.append('Modality', modality);
      formData.append('Image', imageFile);

      const res = await createExpertImage(formData);
      toast.success('Image uploaded successfully!');
      if (res && res.id) {
        setUploadedImageId(res.id);
        setAnnotImageId(res.id);
        // Reload images list
        fetchExpertImages(1, 100).then(setImagesList).catch(() => { });
      }
      setImageFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload image');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!annotImageId) return toast.error('Please select an image');
    if (!label) return toast.error('Please provide a label');
    if (!coordinates.trim()) return toast.error('Click and drag on the image to draw a rectangle ROI');
    setIsMutating(true);
    try {
      await createExpertAnnotation({
        imageId: annotImageId.trim(),
        label: label.trim(),
        coordinates: coordinates.trim(),
      });
      toast.success('Annotation added successfully!');
      setLabel('');
      setCoordinates('');
      setDrawStart(null);
      setDrawEnd(null);
      setCommittedBox(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add annotation');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagId) return toast.error('Please provide a Tag ID');
    setIsMutating(true);
    try {
      await createExpertCaseTag({
        medicalCaseId: caseId,
        tagId: tagId.trim(),
      });
      toast.success('Tag added successfully!');
      setTagId('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add tag');
    } finally {
      setIsMutating(false);
    }
  };

  const normFromClient = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return normalizeClientPointFromRect(clientX, clientY, rect);
  };

  const handleDrawMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = drawLayerRef.current;
    if (!el) return;
    e.preventDefault();
    const startPt = normFromClient(e.clientX, e.clientY, el);
    if (!startPt) return;
    setCommittedBox(null);
    setCoordinates('');
    setDrawStart(startPt);
    setDrawEnd(startPt);

    const onMove = (ev: MouseEvent) => {
      const p = normFromClient(ev.clientX, ev.clientY, el);
      if (p) setDrawEnd(p);
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const end = normFromClient(ev.clientX, ev.clientY, el) ?? startPt;
      setDrawStart(null);
      setDrawEnd(null);
      const box = cornersNormalizedToBox(startPt, end);
      if (box) {
        setCommittedBox(box);
        const s = serializeNormalizedBoundingBox(box);
        if (s) setCoordinates(s);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const draftBox = drawStart && drawEnd ? cornersNormalizedToDraftBox(drawStart, drawEnd) : null;

  const title = effectiveMode === 'tags' ? 'Manage Tags' : 'Image & Annotation';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
        {allowModeSwitch ? (
          <div className="mb-4 flex gap-2 rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setActiveMode('tags')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                effectiveMode === 'tags'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tags
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('annotation')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                effectiveMode === 'annotation'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Images &amp; annotations
            </button>
          </div>
        ) : null}

        {/* ── TAGS MODE ──────────────────────────────────────────────────── */}
        {effectiveMode === 'tags' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-input/20">
              <h4 className="text-sm font-medium mb-3">Add Case Tag</h4>
              <div className="flex gap-3 mb-3">
                <select
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select Tag...</option>
                  {tagsList.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={isMutating || !tagId}
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>
          </div>
        )}

        {/* ── ANNOTATION MODE ────────────────────────────────────────────── */}
        {effectiveMode === 'annotation' && (
          <div className="space-y-6">
            {/* 1. Upload Image */}
            <div className="p-4 rounded-xl border border-border bg-input/20">
              <h4 className="text-sm font-medium mb-3">1. Upload New Image</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="px-3 py-2 text-sm bg-card border border-border rounded-lg"
                />
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="X-Ray">X-Ray</option>
                  <option value="CT">CT</option>
                  <option value="MRI">MRI</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                disabled={isMutating || !imageFile}
                onClick={handleUploadImage}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Upload Image
              </button>
              {uploadedImageId && (
                <p className="text-xs text-success mt-2">
                  Uploaded Image ID: <strong className="select-all">{uploadedImageId}</strong>
                </p>
              )}
            </div>

            {/* 2. Draw Annotation */}
            <div className="p-4 rounded-xl border border-border bg-input/20">
              <h4 className="text-sm font-medium mb-3">2. Draw Annotation</h4>

              {isLoadingImages ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading images...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Image selector — pulls from /annotation list */}
                    <select
                      value={annotImageId}
                      onChange={(e) => {
                        setAnnotImageId(e.target.value);
                        setDrawStart(null);
                        setDrawEnd(null);
                        setCommittedBox(null);
                        setCoordinates('');
                      }}
                      className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select Image...</option>
                      {imagesList.length > 0 &&
                        imagesList.map((img) => (
                          <option key={img.id} value={img.id}>
                            {img.fileName || img.id}
                          </option>
                        ))
                      }
                    </select>

                    <input
                      type="text"
                      placeholder="Label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
                    />
                  </div>

                  {/* Coordinates display */}
                  <input
                    type="text"
                    placeholder='Coordinates JSON e.g. {"x":0.1,"y":0.2,"width":0.3,"height":0.4}'
                    value={coordinates}
                    readOnly
                    className="mb-3 w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-[10px] focus:outline-none"
                  />

                  {/* Image drawing area */}
                  {resolvedImageUrl ? (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Click and drag on the image to draw a rectangle ROI (normalized coordinates)
                        </span>
                        <button
                          type="button"
                          disabled={isMutating || (!committedBox && !draftBox)}
                          onClick={() => {
                            setDrawStart(null);
                            setDrawEnd(null);
                            setCommittedBox(null);
                            setCoordinates('');
                          }}
                          className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        >
                          Clear ROI
                        </button>
                      </div>
                      <div
                        ref={drawLayerRef}
                        role="presentation"
                        className="relative cursor-crosshair select-none overflow-hidden rounded-lg border border-border bg-muted/40 shadow-inner"
                        onMouseDown={handleDrawMouseDown}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvedImageUrl}
                          alt="Annotation target"
                          className="pointer-events-none block h-auto w-full"
                        />
                        <RectangleAnnotationOverlay closed={committedBox} draft={draftBox} label="ROI" />
                      </div>
                    </div>
                  ) : (
                    annotImageId === '' && (
                      <p className="text-xs text-muted-foreground mb-3">← Select an image above to start drawing.</p>
                    )
                  )}

                  <button
                    disabled={isMutating || !annotImageId || !label || !coordinates.trim()}
                    onClick={handleAddAnnotation}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save Annotation
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-input"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
