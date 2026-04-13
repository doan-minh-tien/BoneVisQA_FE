import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaSessionReport } from './normalize-visual-qa';
import type {
  NormalizedImageBoundingBox,
  VisualQaSessionReport,
} from './types';
import { serializeNormalizedBoundingBox } from '@/lib/utils/annotations';

export interface StudentVisualQaAskOptions {
  roiBoundingBox?: NormalizedImageBoundingBox | null;
  onUploadProgress?: (percent: number) => void;
  sessionId?: string | null;
  caseId?: string | null;
  imageId?: string | null;
}

export async function postStudentVisualQa(
  file: File,
  questionText: string,
  options: StudentVisualQaAskOptions = {},
): Promise<VisualQaSessionReport> {
  const form = new FormData();
  form.append('CustomImage', file);
  form.append('QuestionText', questionText);
  const serialized = serializeNormalizedBoundingBox(options.roiBoundingBox);
  if (serialized) {
    form.append('customPolygon', serialized);
  }
  if (options.sessionId?.trim()) {
    form.append('SessionId', options.sessionId.trim());
  }
  if (options.caseId?.trim()) {
    form.append('CaseId', options.caseId.trim());
  }
  if (options.imageId?.trim()) {
    form.append('ImageId', options.imageId.trim());
  }

  try {
    const { data } = await http.post<unknown>('/api/student/visual-qa/ask', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (!options.onUploadProgress || !ev.total) return;
        const pct = Math.round((ev.loaded / ev.total) * 100);
        options.onUploadProgress(Math.min(100, pct));
      },
    });
    const payload =
      data && typeof data === 'object' && 'data' in (data as object)
        ? (data as { data: unknown }).data
        : data;
    return normalizeVisualQaSessionReport(payload);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      throw e;
    }
    throw new Error(getApiErrorMessage(e));
  }
}
