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
  const [coordinates, setCoordinates] = useState('{}');

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
      setCoordinates('{}');
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
              <input
                type="text"
                placeholder="Modality (e.g. MRI, X-Ray)"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
              />
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
                onChange={(e) => setAnnotImageId(e.target.value)}
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
                className="px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none"
              />
            </div>
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
