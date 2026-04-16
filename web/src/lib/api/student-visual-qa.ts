import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import { normalizeVisualQaSessionReport } from './normalize-visual-qa';
import type {
  NormalizedImageBoundingBox,
  VisualQaSessionReport,
} from './types';
import { serializeNormalizedBoundingBox } from '@/lib/utils/annotations';

function unwrapVisualQaPayload(data: unknown): unknown {
  return data && typeof data === 'object' && 'data' in (data as object)
    ? (data as { data: unknown }).data
    : data;
}

export interface StudentVisualQaAskOptions {
  roiBoundingBox?: NormalizedImageBoundingBox | null;
  onUploadProgress?: (percent: number) => void;
  sessionId?: string | null;
  caseId?: string | null;
  imageId?: string | null;
  clientRequestId?: string | null;
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
  if (options.clientRequestId?.trim()) {
    form.append('ClientRequestId', options.clientRequestId.trim());
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
    const payload = unwrapVisualQaPayload(data);
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
  turnId?: string | null,
): Promise<VisualQaSessionReport> {
  const id = sessionId.trim();
  if (!id) throw new Error('Session id is required.');
  try {
    if (turnId?.trim()) {
      try {
        const { data } = await http.post<unknown>(
          `/api/student/visual-qa/turns/${encodeURIComponent(turnId.trim())}/request-review`,
          undefined,
          { params: { sessionId: id } },
        );
        const payload = unwrapVisualQaPayload(data);
        return normalizeVisualQaSessionReport(payload);
      } catch (e) {
        if (!(axios.isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 405))) {
          throw e;
        }
      }
    }

    const { data } = await http.post<unknown>(`/api/student/visual-qa/${encodeURIComponent(id)}/request-review`);
    const payload = unwrapVisualQaPayload(data);
    return normalizeVisualQaSessionReport(payload);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      throw e;
    }
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchStudentVisualQaSession(
  sessionId: string,
): Promise<VisualQaSessionReport> {
  const id = sessionId.trim();
  if (!id) throw new Error('Session id is required.');
  const candidateUrls = [
    `/api/student/visual-qa/history/${encodeURIComponent(id)}`,
    `/api/student/visual-qa/history`,
    `/api/student/visual-qa/${encodeURIComponent(id)}`,
  ];

  for (const url of candidateUrls) {
    try {
      const { data } = await http.get<unknown>(url, url.endsWith('/history') ? { params: { sessionId: id } } : undefined);
      const payload = unwrapVisualQaPayload(data);
      return normalizeVisualQaSessionReport(payload);
    } catch (e) {
      if (axios.isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 405)) {
        continue;
      }
      if (axios.isAxiosError(e)) {
        throw e;
      }
      throw new Error(getApiErrorMessage(e));
    }
  }

  throw new Error('Could not restore this Visual QA session.');
}
