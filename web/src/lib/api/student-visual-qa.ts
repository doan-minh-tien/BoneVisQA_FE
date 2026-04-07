import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaReport } from './normalize-visual-qa';
import type { NormalizedPolygonPoint, VisualQaReport } from './types';
import { serializeCustomPolygon } from '@/lib/utils/annotations';

export async function postStudentVisualQa(
  file: File,
  questionText: string,
  customPolygon?: NormalizedPolygonPoint[] | null,
  onUploadProgress?: (percent: number) => void,
): Promise<VisualQaReport> {
  const form = new FormData();
  form.append('CustomImage', file);
  form.append('QuestionText', questionText);
  const serialized = serializeCustomPolygon(customPolygon);
  if (serialized) {
    form.append('customPolygon', serialized);
  }

  try {
    const { data } = await http.post<unknown>('/api/student/visual-qa/ask', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (!onUploadProgress || !ev.total) return;
        const pct = Math.round((ev.loaded / ev.total) * 100);
        onUploadProgress(Math.min(100, pct));
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
