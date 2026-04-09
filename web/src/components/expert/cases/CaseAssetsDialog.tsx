'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  createExpertImage,
  createExpertAnnotation,
  createExpertCaseTag,
  fetchExpertTags,
  fetchExpertImages,
  type ExpertTag,
  type ExpertImageDto,
} from '@/lib/api/expert-cases';

interface CaseAssetsDialogProps {
  caseId: string;
  onClose: () => void;
}

export default function CaseAssetsDialog({ caseId, onClose }: CaseAssetsDialogProps) {
  const toast = useToast();
  const [isMutating, setIsMutating] = useState(false);

  // Image form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modality, setModality] = useState('MRI');
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  // Annotation form
  const [annotImageId, setAnnotImageId] = useState('');
  const [label, setLabel] = useState('');
  const [coordinates, setCoordinates] = useState('[]');
  const [polyPoints, setPolyPoints] = useState<{x: number, y: number}[]>([]);

  // Tag form
  const [tagId, setTagId] = useState('');

  // Options
  const [tagsList, setTagsList] = useState<ExpertTag[]>([]);
  const [imagesList, setImagesList] = useState<ExpertImageDto[]>([]);

  useEffect(() => {
    fetchExpertTags(1, 100)
      .then(setTagsList)
      .catch((e) => console.error('fetch tags failed', e));

    fetchExpertImages(1, 100)
      .then(setImagesList)
      .catch((e) => console.error('fetch images failed', e));
  }, []);

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
        setAnnotImageId(res.id); // Auto-fill for convenience
        // Reload images list
        fetchExpertImages(1, 100).then(setImagesList).catch(() => {});
      }
      setImageFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload image');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!annotImageId) return toast.error('Please provide an Image ID');
    if (!label) return toast.error('Please provide a label');
    setIsMutating(true);
    try {
      await createExpertAnnotation({
        imageId: annotImageId.trim(),
        label: label.trim(),
        coordinates: coordinates.trim(),
      });
      toast.success('Annotation added successfully!');
      setLabel('');
      setCoordinates('[]');
      setPolyPoints([]);
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

  const selectedImageUrl = imagesList.find((img) => img.id === annotImageId)?.imageUrl;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - rect.left) / rect.width).toFixed(4));
    const y = Number(((e.clientY - rect.top) / rect.height).toFixed(4));
    
    const newPoints = [...polyPoints, { x, y }];
    setPolyPoints(newPoints);
    setCoordinates(JSON.stringify(newPoints));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Manage Media & Tags</h3>

        <div className="space-y-6">
          {/* 1. Add Image */}
          <div className="p-4 rounded-xl border border-border bg-input/20">
            <h4 className="text-sm font-medium mb-3">1. Upload Image</h4>
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
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Upload Image
            </button>
            {uploadedImageId && (
              <p className="text-xs text-success mt-2">
                Last uploaded Image ID: <strong className="select-all">{uploadedImageId}</strong>
              </p>
            )}
          </div>

          {/* 2. Add Annotation */}
          <div className="p-4 rounded-xl border border-border bg-input/20">
            <h4 className="text-sm font-medium mb-3">2. Add Annotation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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
                  <option key={img.id} value={img.id}>
                    {img.fileName || img.id}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Coordinates (JSON)"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none font-mono text-[10px]"
                readOnly
              />
            </div>

            {/* Polygon Preview & Drawing Area */}
            {selectedImageUrl && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Click on the image to draw a polygon selection</span>
                  <button
                    disabled={isMutating || polyPoints.length === 0}
                    onClick={() => {
                      setPolyPoints([]);
                      setCoordinates('[]');
                    }}
                    className="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    Clear Points
                  </button>
                </div>
                <div 
                  className="relative rounded-lg overflow-hidden border border-border cursor-crosshair bg-black/5 shadow-inner select-none"
                  onClick={handleImageClick}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImageUrl} alt="Target" className="w-full h-auto block pointer-events-none" />
                  
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {polyPoints.length > 0 && (
                      <polygon 
                        points={polyPoints.map(p => `${p.x * 100},${p.y * 100}`).join(' ')} 
                        fill="rgba(59, 130, 246, 0.25)" 
                        stroke="#3b82f6" 
                        strokeWidth="0.5" 
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray={polyPoints.length >= 3 ? "none" : "2,2"}
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
            )}

            <button
              disabled={isMutating || !annotImageId || !label}
              onClick={handleAddAnnotation}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Add Annotation
            </button>
          </div>

          {/* 3. Add Tag */}
          <div className="p-4 rounded-xl border border-border bg-input/20">
            <h4 className="text-sm font-medium mb-3">3. Add Case Tag</h4>
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
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Add Tag
            </button>
          </div>
        </div>

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
