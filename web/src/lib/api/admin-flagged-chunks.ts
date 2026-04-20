import axios from 'axios';
import { http, getApiErrorMessage } from '@/lib/api/client';

/** Khớp `AdminFlaggedChunkListItemDto` — GET flagged list (camelCase). */
export interface AdminFlaggedChunkRow {
  chunkId: string;
  documentId?: string | null;
  documentTitle?: string | null;
  /** Cùng giá trị BE `snippet` / `preview` (đoạn trích chunk). */
  contentPreview: string;
  flagReason?: string | null;
  flaggedAt?: string | null;
  flaggedByExpertId?: string | null;
  flaggedBy?: string | null;
  flagResolved?: boolean | null;
}

function mapRow(raw: unknown): AdminFlaggedChunkRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const chunkId = String(r.chunkId ?? r.documentChunkId ?? r.id ?? r.chunk_id ?? '').trim();
  const text = String(
    r.preview ??
      r.snippet ??
      r.sourceText ??
      r.text ??
      r.content ??
      r.chunkText ??
      '',
  ).trim();
  if (!chunkId) return null;
  const displayText =
    text ||
    String(r.documentTitle ?? r.document_title ?? r.title ?? '').trim() ||
    '(No preview — chunk flagged; open document or check API)';
  const expertId =
    r.flaggedByExpertId != null
      ? String(r.flaggedByExpertId)
      : r.flagged_by_expert_id != null
        ? String(r.flagged_by_expert_id)
        : null;
  return {
    chunkId,
    documentId: r.documentId != null ? String(r.documentId) : r.document_id != null ? String(r.document_id) : null,
    documentTitle:
      r.documentTitle != null
        ? String(r.documentTitle)
        : r.document_title != null
          ? String(r.document_title)
          : null,
    contentPreview: displayText.length > 360 ? `${displayText.slice(0, 357)}…` : displayText,
    flagReason: r.reason != null ? String(r.reason) : r.flagReason != null ? String(r.flagReason) : null,
    flaggedAt: r.flaggedAt != null ? String(r.flaggedAt) : r.createdAt != null ? String(r.createdAt) : null,
    flaggedByExpertId: expertId,
    flaggedBy: r.flaggedBy != null ? String(r.flaggedBy) : null,
    flagResolved:
      typeof r.flagResolved === 'boolean'
        ? r.flagResolved
        : typeof r.isResolved === 'boolean'
          ? r.isResolved
          : null,
  };
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.results)) return o.results;
  return [];
}

/** Cùng handler BE: ưu tiên path documents. */
export async function fetchAdminFlaggedChunks(): Promise<AdminFlaggedChunkRow[]> {
  const paths = ['/api/admin/documents/chunks/flagged', '/api/admin/rag/flagged-chunks'];
  for (const path of paths) {
    try {
      const { data } = await http.get<unknown>(path);
      return unwrapList(data)
        .map(mapRow)
        .filter((x): x is AdminFlaggedChunkRow => x !== null);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) continue;
      throw new Error(getApiErrorMessage(e));
    }
  }
  return [];
}

/** Body BE: `{ "resolved": true }` — xóa cờ chunk; `resolved` khác true → 400. */
export async function patchAdminChunkFlagResolution(
  chunkId: string,
  payload: { resolved: boolean; note?: string },
): Promise<void> {
  const id = chunkId.trim();
  if (!id) throw new Error('Chunk id is required.');
  const body: Record<string, unknown> = { resolved: payload.resolved };
  if (payload.note?.trim()) body.note = payload.note.trim();
  const paths = [
    `/api/admin/documents/chunks/${encodeURIComponent(id)}/flag`,
    `/api/admin/rag/chunks/${encodeURIComponent(id)}/flag`,
  ];
  let lastErr: unknown;
  for (const url of paths) {
    try {
      await http.patch(url, body);
      return;
    } catch (e) {
      lastErr = e;
      if (axios.isAxiosError(e) && e.response?.status === 404) continue;
      throw new Error(getApiErrorMessage(e));
    }
  }
  throw new Error(lastErr instanceof Error ? lastErr.message : 'Could not resolve chunk flag.');
}
