import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { PercentageBoundingBox, VisualQaReport } from './types';
import { serializePercentageBoundingBox } from '@/lib/utils/annotations';

export async function postStudentVisualQa(
  file: File,
  questionText: string,
  annotationBox?: PercentageBoundingBox | null,
  onUploadProgress?: (percent: number) => void,
): Promise<VisualQaReport> {
  const form = new FormData();
  form.append('CustomImage', file);
  form.append('QuestionText', questionText);
  const serializedBox = serializePercentageBoundingBox(annotationBox);
  if (serializedBox) {
    form.append('CustomCoordinates', serializedBox);
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
