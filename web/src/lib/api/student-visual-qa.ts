import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { VisualQaReport } from './types';
import type { BoundingBox } from '@/components/student/MedicalImageViewer';

export async function postStudentVisualQa(
  file: File,
  questionText: string,
  annotationBox?: BoundingBox | null,
  onUploadProgress?: (percent: number) => void,
): Promise<VisualQaReport> {
  const form = new FormData();
  form.append('CustomImage', file);
  form.append('QuestionText', questionText);
  if (annotationBox && annotationBox.width > 0 && annotationBox.height > 0) {
    form.append('CustomCoordinates', JSON.stringify(annotationBox));
  }

  try {
    const { data } = await http.post<unknown>('/api/Students/VisualQA/ask', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (ev.total && onUploadProgress) {
          onUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      },
    });
    const payload =
      data && typeof data === 'object' && 'data' in (data as object)
        ? (data as { data: unknown }).data
        : data;
    return normalizeVisualQaReport(payload);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
