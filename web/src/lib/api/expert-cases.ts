import { http, getApiErrorMessage } from './client';

export type CaseDifficulty = 'Easy' | 'Medium' | 'Hard';
export type CaseStatus = 'approved' | 'pending' | 'draft';

export interface ExpertCase {
  id: string;
  createdByExpertId: string;
  categoryId: string;
  title: string;
  categoryName: string;
  difficulty: CaseDifficulty;
  status: CaseStatus;
  isApproved: boolean;
  isActive: boolean;
  addedBy: string;
  addedDate: string;
  description: string;
  suggestedDiagnosis: string;
  reflectiveQuestions: string;
  keyFindings: string;
}

interface ExpertCaseListResponse {
  items?: unknown[];
}

interface ExpertCaseApiRow {
  id?: unknown;
  createdByExpertId?: unknown;
  categoryId?: unknown;
  title?: unknown;
  expertName?: unknown;
  difficulty?: unknown;
  categoryName?: unknown;
  isApproved?: unknown;
  isActive?: unknown;
  createdAt?: unknown;
  description?: unknown;
  suggestedDiagnosis?: unknown;
  reflectiveQuestions?: unknown;
  keyFindings?: unknown;
}

function mapDifficulty(raw: unknown): CaseDifficulty {
  const val = String(raw ?? '').toLowerCase();
  if (val === 'hard' || val === 'advanced') return 'Hard';
  if (val === 'medium' || val === 'intermediate') return 'Medium';
  return 'Easy';
}

function mapStatus(isApproved: unknown, isActive: unknown): CaseStatus {
  if (Boolean(isApproved)) return 'approved';
  if (Boolean(isActive)) return 'pending';
  return 'draft';
}

function mapCase(row: unknown): ExpertCase | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as ExpertCaseApiRow;
  const id = String(item.id ?? '');
  if (!id) return null;

  return {
    id,
    createdByExpertId: String(item.createdByExpertId ?? ''),
    categoryId: String(item.categoryId ?? ''),
    title: String(item.title ?? 'Untitled case'),
    categoryName: String(item.categoryName ?? 'General'),
    difficulty: mapDifficulty(item.difficulty),
    status: mapStatus(item.isApproved, item.isActive),
    isApproved: Boolean(item.isApproved),
    isActive: Boolean(item.isActive),
    addedBy: String(item.expertName ?? 'Unknown expert'),
    addedDate: String(item.createdAt ?? ''),
    description: String(item.description ?? ''),
    suggestedDiagnosis: String(item.suggestedDiagnosis ?? ''),
    reflectiveQuestions: String(item.reflectiveQuestions ?? ''),
    keyFindings: String(item.keyFindings ?? ''),
  };
}

export async function fetchExpertCases(): Promise<ExpertCase[]> {
  try {
    const { data } = await http.get<ExpertCaseListResponse>('/api/expert/cases?pageIndex=1&pageSize=100');
    const list = Array.isArray(data?.items) ? data.items : [];
    return list.map(mapCase).filter((item): item is ExpertCase => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface SaveExpertCaseInput {
  title: string;
  createdByExpertId: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isApproved: boolean;
  isActive: boolean;
  categoryId: string;
  suggestedDiagnosis: string;
  reflectiveQuestions: string;
  keyFindings: string;
}

export async function createExpertCase(input: SaveExpertCaseInput): Promise<void> {
  try {
    await http.post('/api/expert/cases', input);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateExpertCase(id: string, input: SaveExpertCaseInput): Promise<void> {
  try {
    await http.patch(`/api/expert/cases/${id}`, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function approveExpertCase(id: string): Promise<ExpertCase> {
  try {
    const { data } = await http.patch<unknown>(`/api/expert/cases/${id}`, { isApproved: true });
    const mapped = mapCase(data);
    if (!mapped) throw new Error('Invalid case response from server');
    return mapped;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function deleteExpertCase(id: string): Promise<void> {
  try {
    await http.delete(`/api/expert/cases/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
