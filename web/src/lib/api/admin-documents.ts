import { http, getApiErrorMessage } from './client';
import type { CategoryOption, DocumentUploadResponse, TagOption } from './types';

const ADMIN = '/api/Admin';

export async function fetchDocumentCategories(): Promise<CategoryOption[]> {
  const { data } = await http.get<unknown[] | { items?: unknown[] }>(`${ADMIN}/categories`);
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map((row) => mapCategory(row));
}

export async function fetchDocumentTags(): Promise<TagOption[]> {
  const { data } = await http.get<unknown[] | { items?: unknown[] }>(`${ADMIN}/tags`);
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map((row) => mapTag(row));
}

function mapCategory(row: unknown): CategoryOption {
  if (row && typeof row === 'object') {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? r.categoryId ?? ''),
      name: String(r.name ?? r.title ?? ''),
    };
  }
  return { id: '', name: '' };
}

function mapTag(row: unknown): TagOption {
  if (row && typeof row === 'object') {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? r.tagId ?? ''),
      name: String(r.name ?? ''),
    };
  }
  return { id: '', name: '' };
}

export interface UploadDocumentParams {
  file: File;
  categoryId: string;
  tagIds: string[];
  onUploadProgress?: (percent: number) => void;
}

export async function uploadAdminDocument(
  params: UploadDocumentParams,
): Promise<DocumentUploadResponse> {
  const form = new FormData();
  form.append('file', params.file);
  form.append('CategoryId', params.categoryId);
  params.tagIds.forEach((id) => form.append('TagIds', id));

  try {
    const { data } = await http.post<DocumentUploadResponse>(
      `${ADMIN}/document-upload`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total && params.onUploadProgress) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            params.onUploadProgress(pct);
          }
        },
      },
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
