import { http, getApiErrorMessage } from './client';

export type CaseDifficulty = 'Easy' | 'Medium' | 'Hard';
export type CaseStatus = 'approved' | 'pending' | 'rejected';

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
  /** Some backends may use snake_case / different casing */
  category_id?: unknown;
  categoryID?: unknown;
  /** Some backends return category as nested object */
  category?: unknown;
  title?: unknown;
  expertName?: unknown;
  difficulty?: unknown;
  categoryName?: unknown;
  category_name?: unknown;
  /** Alternative field names */
  caseTitle?: unknown;
  isApproved?: unknown;
  approved?: unknown;
  isActive?: unknown;
  active?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
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
  return 'rejected';
}

function mapCase(row: unknown): ExpertCase | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as ExpertCaseApiRow;
  const record = row as Record<string, unknown>;

  const id = String(
    item.id ??
      item.caseTitle ??
      record.caseId ??
      record.Id ??
      record.ID ??
      '',
  );
  if (!id) return null;

  const categoryFromNested =
    item.category && typeof item.category === 'object'
      ? (item.category as Record<string, unknown>)
      : null;

  const categoryFromNestedId =
    categoryFromNested?.id ?? categoryFromNested?.Id ?? categoryFromNested?.categoryId ?? categoryFromNested?.CategoryId;
  const categoryFromNestedName =
    categoryFromNested?.name ??
    categoryFromNested?.Name ??
    categoryFromNested?.categoryName ??
    categoryFromNested?.CategoryName ??
    categoryFromNested?.title ??
    categoryFromNested?.Title;

  const categoryIdRaw =
    item.categoryId ??
    item.category_id ??
    item.categoryID ??
    (record as Record<string, unknown>).CategoryId ??
    (record as Record<string, unknown>).CategoryID ??
    (record as Record<string, unknown>).categoryId ??
    (record as Record<string, unknown>).categoryID ??
    categoryFromNested?.id ??
    categoryFromNested?.categoryId ??
    categoryFromNested?.categoryID ??
    categoryFromNestedId ??
    record.categoryId;

  const categoryNameRaw =
    item.categoryName ??
    item.category_name ??
    categoryFromNested?.name ??
    categoryFromNested?.title ??
    (categoryFromNested as Record<string, unknown> | null | undefined)?.categoryName ??
    (categoryFromNested as Record<string, unknown> | null | undefined)?.category_name ??
    categoryFromNestedName ??
    (record as Record<string, unknown>).CategoryName ??
    (record as Record<string, unknown>).categoryName ??
    record.categoryName ??
    'General';

  return {
    id,
    createdByExpertId: String(
      item.createdByExpertId ?? record.createdByExpertId ?? record.CreatedByExpertId ?? '',
    ),
    categoryId: String(categoryIdRaw ?? ''),
    title: String(item.title ?? item.caseTitle ?? record.title ?? record.Title ?? 'Untitled case'),
    categoryName: String(categoryNameRaw),
    difficulty: mapDifficulty(item.difficulty ?? record.caseDifficulty ?? record.difficulty ?? record.Difficulty),
    status: mapStatus(
      item.isApproved ?? item.approved ?? record.approved ?? record.IsApproved,
      item.isActive ?? item.active ?? record.active ?? record.IsActive,
    ),
    isApproved: Boolean(item.isApproved ?? item.approved ?? record.isApproved ?? record.approved ?? record.IsApproved),
    isActive: Boolean(item.isActive ?? item.active ?? record.isActive ?? record.active ?? record.IsActive),
    addedBy: String(item.expertName ?? record.addedBy ?? record.ExpertName ?? 'Unknown expert'),
    addedDate: String(item.createdAt ?? item.created_at ?? record.CreatedAt ?? record.createdAt ?? ''),
    description: String(item.description ?? ''),
    suggestedDiagnosis: String(item.suggestedDiagnosis ?? record.suggested_diagnosis ?? record.SuggestedDiagnosis ?? ''),
    reflectiveQuestions: String(
      item.reflectiveQuestions ?? record.reflective_questions ?? record.ReflectiveQuestions ?? '',
    ),
    keyFindings: String(item.keyFindings ?? record.key_findings ?? record.KeyFindings ?? ''),
  };
}

export async function fetchExpertCases(): Promise<ExpertCase[]> {
  try {
    const { data } = await http.get<unknown>('/api/expert/cases?pageIndex=1&pageSize=100');
    const body = data as any;
    // Một số BE trả trực tiếp array, một số trả { items: [] }, hoặc lồng thêm "data"
    let list: unknown[] = [];
    if (Array.isArray(body)) list = body;
    else if (Array.isArray(body?.items)) list = body.items;
    else if (Array.isArray(body?.data)) list = body.data;
    else if (Array.isArray(body?.result)) list = body.result;
    else if (Array.isArray(body?.data?.items)) list = body.data.items;
    else if (Array.isArray(body?.items?.items)) list = body.items.items;
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
