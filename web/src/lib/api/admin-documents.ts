import { http, getApiErrorMessage } from './client';
import type { CategoryOption, DocumentUploadResponse, TagOption } from './types';

const ADMIN_DOCUMENTS = '/api/admin/documents';

export async function fetchDocumentCategories(): Promise<CategoryOption[]> {
  const { data } = await http.get<unknown[] | { items?: unknown[] }>(`${ADMIN_DOCUMENTS}/categories`);
  const list = Array.isArray(data) ? data : data?.items ?? [];
  return list.map((row) => mapCategory(row));
}

export async function fetchDocumentTags(): Promise<TagOption[]> {
  const { data } = await http.get<unknown[] | { items?: unknown[] }>(`${ADMIN_DOCUMENTS}/tags`);
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
      `${ADMIN_DOCUMENTS}/upload`,
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

export interface AdminDocumentDetail {
  id: string;
  title: string;
  createdAt: string;
  version?: string;
  categoryId?: string;
  indexingStatus: string;
  isOutdated?: boolean;
  filePath?: string;
}

export type DocumentDto = AdminDocumentDetail;

function mapAdminDocumentDetail(row: unknown): AdminDocumentDetail {
  const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? r.documentId ?? ''),
    title: String(r.title ?? r.fileName ?? r.name ?? ''),
    createdAt: String(r.createdAt ?? r.uploadedAt ?? new Date().toISOString()),
    version: r.version != null ? String(r.version) : undefined,
    categoryId: r.categoryId != null ? String(r.categoryId) : undefined,
    indexingStatus: String(r.indexingStatus ?? r.status ?? 'Unknown'),
    isOutdated: Boolean(r.isOutdated ?? false),
    filePath:
      r.filePath != null
        ? String(r.filePath)
        : r.documentUrl != null
          ? String(r.documentUrl)
          : undefined,
  };
}

export async function getAdminDocumentById(id: string): Promise<AdminDocumentDetail> {
  try {
    const { data } = await http.get<unknown>(`${ADMIN_DOCUMENTS}/${id}`);
    return mapAdminDocumentDetail(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getAdminDocuments(): Promise<DocumentDto[]> {
  try {
    const { data } = await http.get<unknown>(ADMIN_DOCUMENTS);
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? ((data as { items?: unknown[] }).items ?? [])
        : [];
    return list.map(mapAdminDocumentDetail);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function reindexAdminDocument(
  id: string,
): Promise<{ message?: string; indexingStatus?: string }> {
  try {
    const { data } = await http.post<{ message?: string; indexingStatus?: string }>(
      `${ADMIN_DOCUMENTS}/${id}/reindex`,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
