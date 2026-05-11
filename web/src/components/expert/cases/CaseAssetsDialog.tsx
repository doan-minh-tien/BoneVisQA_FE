'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { Loader2, Image as ImageIcon, Tag, Edit3, ChevronDown } from 'lucide-react';
import {
  createExpertImage,
  createExpertAnnotation,
  createExpertCaseTag,
  DB_IMAGE_MODALITIES,
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
  /** 
   * tags          – add a tag to the case
   * upload-image  – upload a new image for the case
   * add-annotation – draw + save an annotation on a case image
   * images        – view all images belonging to this case
   * annotations   – view all annotations; select an image → see its annotations
   */
  mode: 'tags' | 'upload-image' | 'add-annotation' | 'images' | 'annotations';
  onClose: () => void;
  /** Lets experts switch between tags and images/annotations in one modal (e.g. after creating a case). */
  allowModeSwitch?: boolean;
}

const BASE_URL = 'https://localhost:5047';

function resolveUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

export default function CaseAssetsDialog({ caseId, mode, onClose }: CaseAssetsDialogProps) {
export default function CaseAssetsDialog({ caseId, mode, onClose, allowModeSwitch }: CaseAssetsDialogProps) {
  const toast = useToast();
  const [isMutating, setIsMutating] = useState(false);

  // ── shared data ──────────────────────────────────────────────────────────
  const [tagsList, setTagsList] = useState<ExpertTag[]>([]);
  const [imagesList, setImagesList] = useState<ExpertImageDto[]>([]);
  const [annotationsList, setAnnotationsList] = useState<ExpertAnnotationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination states
  const [imagePage, setImagePage] = useState(1);
  const [imageTotal, setImageTotal] = useState(0);
  const [annotPage, setAnnotPage] = useState(1);
  const [annotTotal, setAnnotTotal] = useState(0);
  const pageSize = 3;

  // ── tags form ─────────────────────────────────────────────────────────────
  const [tagId, setTagId] = useState('');

  // ── image upload ─────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modality, setModality] = useState<string>(DB_IMAGE_MODALITIES[0]);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  // ── annotation form ───────────────────────────────────────────────────────
  const [annotImageId, setAnnotImageId] = useState('');
  const [label, setLabel] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [committedBox, setCommittedBox] = useState<NormalizedImageBoundingBox | null>(null);
  const drawLayerRef = useRef<HTMLDivElement | null>(null);

  // ── 'annotations' view — selected image to filter by ────────────────────
  const [viewImageId, setViewImageId] = useState('');
  const [filteredAnnotations, setFilteredAnnotations] = useState<ExpertAnnotationDto[]>([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
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

  // ── Load data on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'tags') {
      setIsLoading(true);
      fetchExpertTags(1, 100)
        .then(setTagsList)
        .catch((e) => console.error('fetch tags failed', e))
        .finally(() => setIsLoading(false));
    }

    if (mode === 'upload-image' || mode === 'add-annotation' || mode === 'images' || mode === 'annotations') {
      setIsLoading(true);
      fetchExpertImages(imagePage, mode === 'images' ? pageSize : 100, caseId)
        .then((res) => {
          const imgs = res.items || [];
    if (effectiveMode === 'tags') {
      fetchExpertTags(1, 100)
        .then(setTagsList)
        .catch(() => toast.error('Could not load tags.'));
    }

    if (effectiveMode === 'annotation') {
      setIsLoadingImages(true);
      Promise.all([
        fetchExpertImages(1, 100).catch(() => [] as ExpertImageDto[]),
        fetchExpertAnnotations(1, 100).catch(() => ({ items: [] as ExpertAnnotationDto[], totalCount: 0, pageIndex: 1, pageSize: 100 })),
      ])
        .then(([imgs, annotRes]) => {
          setImagesList(imgs);
          if (mode === 'images') {
            setImageTotal(res.totalCount || 0);
          }
          // For add-annotation: pre-select first image
          if (mode === 'add-annotation' && imgs.length > 0) {
            setAnnotImageId(imgs[0].id);
          }
          // For annotations view: pre-select first image
          if (mode === 'annotations' && imgs.length > 0 && !viewImageId) {
            setViewImageId(imgs[0].id);
          }
        })
        .catch((e) => console.error('fetch images failed', e))
        .finally(() => setIsLoading(false));
    }

    if (mode === 'annotations') {
      // will also load after viewImageId is set via useEffect below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, caseId]);

  // ── Load annotations when viewImageId changes (annotations mode) ─────────
  useEffect(() => {
    if (mode === 'annotations' && viewImageId) {
      setIsLoadingAnnotations(true);
      fetchExpertAnnotations(annotPage, pageSize, viewImageId)
        .then((res) => {
          setFilteredAnnotations(res.items);
          setAnnotTotal(res.totalCount || 0);
        })
        .catch((e) => console.error('fetch annotations failed', e))
        .finally(() => setIsLoadingAnnotations(false));
    }
    if (mode === 'annotations' && !viewImageId) {
      setFilteredAnnotations([]);
      setAnnotTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewImageId, mode, annotPage]);

  // ── Resolved image for annotation drawing ─────────────────────────────────
  const selectedImage = imagesList.find((img) => img.id === annotImageId);
  const resolvedDrawUrl = selectedImage ? resolveUrl(selectedImage.imageUrl) : null;
  }, [effectiveMode, caseId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddTag = async () => {
    if (!tagId) return toast.error('Please select a tag');
    setIsMutating(true);
    try {
      await createExpertCaseTag({ medicalCaseId: caseId, tagId: tagId.trim() });
      toast.success('Tag added successfully!');
      setTagId('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add tag');
    } finally {
      setIsMutating(false);
    }
  };

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
      if (res?.id) {
        setUploadedImageId(res.id);
        // Refresh images list
        fetchExpertImages(imagePage, mode === 'images' ? pageSize : 100, caseId).then((res) => {
          setImagesList(res.items || []);
          if (mode === 'images') setImageTotal(res.totalCount || 0);
        }).catch(() => { });
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
    if (!coordinates.trim()) return toast.error('Click and drag on the image to draw a rectangle ROI');
    setIsMutating(true);
    try {
      await createExpertAnnotation({
        imageId: annotImageId.trim(),
        coordinates: coordinates.trim(),
        ...(label.trim() ? { label: label.trim() } : {}),
      });
      toast.success('Annotation saved!');
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

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - rect.left) / rect.width).toFixed(4));
    const y = Number(((e.clientY - rect.top) / rect.height).toFixed(4));
    const newPoints = [...polyPoints, { x, y }];
    setPolyPoints(newPoints);
    setCoordinates(JSON.stringify(newPoints));
  };

  const titles: Record<typeof mode, string> = {
    tags: 'Manage Tags',
    'upload-image': 'Upload Image',
    'add-annotation': 'Add Annotation',
    images: 'Case Images',
    annotations: 'Annotations',
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
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{titles[mode]}</h3>

        {/* ── TAGS ─────────────────────────────────────────────────────────── */}
        {mode === 'tags' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading tags...
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-input/20">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Add Case Tag</h4>
                <div className="flex gap-3 mb-3">
                  <select
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Tag...</option>
                    {tagsList.map((tag) => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={isMutating || !tagId}
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── UPLOAD IMAGE ─────────────────────────────────────────────────── */}
        {mode === 'upload-image' && (
          <div className="p-4 rounded-xl border border-border bg-input/20">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Upload New Image</h4>
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
                  {DB_IMAGE_MODALITIES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={isMutating || !imageFile}
                onClick={handleUploadImage}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isMutating ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              Upload Image
            </button>
            {uploadedImageId && (
              <p className="text-xs text-success mt-2">
                Uploaded Image ID: <strong className="select-all">{uploadedImageId}</strong>
              </p>
            )}
          </div>
        )}

        {/* ── ADD ANNOTATION ───────────────────────────────────────────────── */}
        {mode === 'add-annotation' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading images...
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-input/20">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Draw Annotation</h4>

                {imagesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No images found for this case. Upload an image first.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <select
                        value={annotImageId}
                        onChange={(e) => {
                          setAnnotImageId(e.target.value);
                          setPolyPoints([]);
                          setCoordinates('[]');
                        }}
                        className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Image...</option>
                        {imagesList.map((img) => (
                          <option key={img.id} value={img.id}>{img.fileName || img.id}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Coordinates (JSON)"
                      value={coordinates}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm font-mono text-[10px] mb-3"
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
                      placeholder="Label (optional)"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
                    />

                    {resolvedDrawUrl ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Click on the image to draw a polygon</span>
                          <button
                            disabled={polyPoints.length === 0}
                            onClick={() => { setPolyPoints([]); setCoordinates('[]'); }}
                            className="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                          >
                            Clear Points
                          </button>
                        </div>
                        <div
                          className="relative rounded-lg overflow-hidden border border-border cursor-crosshair bg-black/5 shadow-inner select-none"
                          onClick={handleImageClick}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolvedDrawUrl} alt="Annotation target" className="w-full h-auto block pointer-events-none" />
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            {polyPoints.length > 0 && (
                              <polygon
                                points={polyPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                                fill="rgba(59, 130, 246, 0.25)"
                                stroke="#3b82f6"
                                strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray={polyPoints.length >= 3 ? 'none' : '2,2'}
                              />
                            )}
                          </svg>
                          {polyPoints.map((p, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow"
                              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      annotImageId === '' && (
                        <p className="text-xs text-muted-foreground mb-3">← Select an image above to start drawing.</p>
                      )
                    )}

                    <button
                      disabled={isMutating || !annotImageId || !label}
                      onClick={handleAddAnnotation}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Save Annotation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IMAGES VIEW ──────────────────────────────────────────────────── */}
        {mode === 'images' && (
          <div className="flex flex-col h-full">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading images...
              </div>
            ) : imagesList.length === 0 ? (
              <div className="py-10 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No images found for this case.</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {imagesList.map((img) => (
                    <div key={img.id} className="rounded-xl border border-border overflow-hidden bg-input/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveUrl(img.imageUrl)}
                        alt={img.fileName}
                        className="w-full aspect-square object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-card-foreground font-medium truncate" title={img.fileName}>{img.fileName}</p>
                        <p className="text-[10px] text-muted-foreground truncate select-all" title={img.id}>{img.id}</p>
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
                  ))}
                </div>
                {imageTotal > pageSize && (
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <span className="text-xs text-muted-foreground">
                      Showing {(imagePage - 1) * pageSize + 1} to {Math.min(imagePage * pageSize, imageTotal)} of {imageTotal}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImagePage(p => Math.max(1, p - 1))}
                        disabled={imagePage === 1}
                        className="px-2 py-1 border border-border rounded text-xs font-medium hover:bg-input disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setImagePage(p => p + 1)}
                        disabled={imagePage * pageSize >= imageTotal}
                        className="px-2 py-1 border border-border rounded text-xs font-medium hover:bg-input disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ANNOTATIONS VIEW ──────────────────────────────────────────────── */}
        {mode === 'annotations' && (
          <div className="space-y-4">
            {/* Image selector */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading images...
              </div>
            ) : (
              <>



                {/* Annotations list */}
                {isLoadingAnnotations ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading annotations...
                  </div>
                ) : viewImageId === '' ? (
                  <p className="text-xs text-muted-foreground">Select an image above to view its annotations.</p>
                ) : filteredAnnotations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No annotations found for this image.</p>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div className="space-y-3 mb-4">
                      {filteredAnnotations.map((ann) => {
                        let coords: { x: number; y: number }[] = [];
                        try { coords = JSON.parse(ann.coordinates); } catch { /* ignore */ }

                        return (
                          <div key={ann.id} className="p-4 rounded-xl border border-border bg-input/10">
                            <div className="flex items-start gap-3">
                              {/* Preview image with overlay */}
                              {ann.imageUrl && (
                                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border bg-black/5">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={resolveUrl(ann.imageUrl)}
                                    alt={ann.label}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  {coords.length > 0 && (
                                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                                      <polygon
                                        points={coords.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                                        fill="rgba(59, 130, 246, 0.3)"
                                        stroke="#3b82f6"
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    </svg>
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-card-foreground mb-1">{ann.label}</p>
                                <p className="text-[10px] text-muted-foreground truncate select-all mb-1" title={ann.id}>ID: {ann.id}</p>
                                <p className="text-[10px] text-muted-foreground font-mono break-all">{ann.coordinates}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {annotTotal > pageSize && (
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAnnotPage(p => Math.max(1, p - 1))}
                            disabled={annotPage === 1}
                            className="px-2 py-1 border border-border rounded text-xs font-medium hover:bg-input disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setAnnotPage(p => p + 1)}
                            disabled={annotPage * pageSize >= annotTotal}
                            className="px-2 py-1 border border-border rounded text-xs font-medium hover:bg-input disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
                  <button
                    disabled={isMutating || !annotImageId || !coordinates.trim()}
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
