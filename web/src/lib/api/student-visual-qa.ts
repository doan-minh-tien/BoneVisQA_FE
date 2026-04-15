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
  file: File | null | undefined,
  questionText: string,
  options: StudentVisualQaAskOptions = {},
): Promise<VisualQaSessionReport> {
  const form = new FormData();
  const hasSession = Boolean(options.sessionId?.trim());
  if (file) {
    form.append('CustomImage', file);
  } else if (!hasSession) {
    throw new Error('Image file is required to start a new visual QA session.');
  }
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

export async function requestStudentVisualQaReview(
  sessionId: string,
): Promise<VisualQaSessionReport> {
  const id = sessionId.trim();
  if (!id) throw new Error('Session id is required.');
  try {
    const { data } = await http.post<unknown>(
      `/api/student/visual-qa/${encodeURIComponent(id)}/request-review`,
    );
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
