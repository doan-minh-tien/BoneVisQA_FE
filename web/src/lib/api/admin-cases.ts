import { getApiErrorMessage, http } from './client';

export interface AdminCaseRow {
  id: string;
  title: string;
  boneLocation: string;
  lesionType: string;
  difficulty: string;
  status: string;
  createdAt: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function mapCaseRow(row: unknown): AdminCaseRow {
  const r = asRecord(row);
  return {
    id: asString(r.id ?? r.caseId),
    title: asString(r.title, 'Untitled case'),
    boneLocation: asString(r.boneLocation ?? r.location, 'Unknown'),
    lesionType: asString(r.lesionType ?? r.type, 'Unknown'),
    difficulty: asString(r.difficulty, 'Unknown'),
    status: asString(r.status, 'Pending'),
    createdAt: asString(r.createdAt ?? r.uploadedAt ?? r.updatedAt, ''),
  };
}

export async function fetchAdminCases(): Promise<AdminCaseRow[]> {
  try {
    const { data } = await http.get<unknown>('/api/admin/cases');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? ((data as { items?: unknown[] }).items ?? [])
        : [];
    return list.map(mapCaseRow).filter((item) => item.id);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
