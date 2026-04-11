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

export interface ExpertCasePagedResponse {
  items: ExpertCase[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export async function fetchExpertCasesPaged(pageIndex = 1, pageSize = 5): Promise<ExpertCasePagedResponse> {
  try {
    const { data } = await http.get<any>(`/api/expert/cases?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const itemsRaw = data?.items ?? data?.result?.items ?? [];
    const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapCase).filter((item): item is ExpertCase => item !== null) : [];
    return {
      items,
      totalCount: Number(data?.totalCount ?? data?.result?.totalCount ?? items.length),
      pageIndex: Number(data?.pageIndex ?? data?.result?.pageIndex ?? pageIndex),
      pageSize: Number(data?.pageSize ?? data?.result?.pageSize ?? pageSize),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ExpertCategory {
  id: string;
  name: string;
}

export async function fetchExpertCategories(): Promise<ExpertCategory[]> {
  try {
    const { data } = await http.get<any>(`/api/expert/category?pageIndex=1&pageSize=100`);
    const listRaw = data?.items ?? data?.result?.items ?? data;
    const list = Array.isArray(listRaw) ? listRaw : [];
    return list.map((c: any) => ({
      id: String(c.id ?? c.Id ?? ''),
      name: String(c.name ?? c.Name ?? c.categoryName ?? c.CategoryName ?? 'Unknown'),
    }));
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
    await http.put(`/api/expert/cases/${id}`, {
      ...input,
      id,
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

// ==== Image & Annotation & Case Tag APIs ====

export async function createExpertImage(payload: FormData): Promise<{ id: string; imageUrl: string; modality: string; caseTitle: string }> {
  try {
    const { data } = await http.post('/api/expert/images', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return (data as any)?.result || data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createExpertAnnotation(payload: { imageId: string; label: string; coordinates: string }): Promise<void> {
  try {
    await http.post('/api/expert/annotations', payload);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createExpertCaseTag(payload: { medicalCaseId: string; tagId: string }): Promise<void> {
  try {
    await http.post('/api/expert/case-tag', payload);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ExpertTag {
  id: string;
  name: string;
}

export async function fetchExpertTags(pageIndex = 1, pageSize = 100): Promise<ExpertTag[]> {
  try {
    const { data } = await http.get<any>(`/api/expert/tag?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const listRaw = data?.items ?? data?.result?.items ?? data;
    const list = Array.isArray(listRaw) ? listRaw : [];
    return list.map((t: any) => ({
      id: String(t.id ?? t.Id ?? ''),
      name: String(t.name ?? t.Name ?? t.tagName ?? t.TagName ?? 'Unknown Tag'),
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ExpertImageDto {
  id: string;
  imageUrl: string;
  fileName: string;
}

export async function fetchExpertImages(pageIndex = 1, pageSize = 100): Promise<ExpertImageDto[]> {
  try {
    const { data } = await http.get<any>(`/api/expert/image?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const listRaw = data?.items ?? data?.result?.items ?? data;
    const list = Array.isArray(listRaw) ? listRaw : [];
    return list.map((i: any) => ({
      id: String(i.id ?? i.Id ?? ''),
      imageUrl: String(i.imageUrl ?? i.ImageUrl ?? ''),
      fileName: String(i.fileName ?? i.FileName ?? 'Unknown File'),
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface ExpertAnnotationDto {
  id: string;
  imageUrl: string;
  label: string;
  coordinates: string;
}

export interface ExpertAnnotationPagedResponse {
  items: ExpertAnnotationDto[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export async function fetchExpertAnnotations(pageIndex = 1, pageSize = 10): Promise<ExpertAnnotationPagedResponse> {
  try {
    const { data } = await http.get<any>(`/api/expert/annotation?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const itemsRaw = data?.items ?? data?.result?.items ?? [];
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((a: any) => ({
          id: String(a.id ?? a.Id ?? ''),
          imageUrl: String(a.imageUrl ?? a.ImageUrl ?? ''),
          label: String(a.label ?? a.Label ?? ''),
          coordinates: String(a.coordinates ?? a.Coordinates ?? '{}'),
        }))
      : [];
    return {
      items,
      totalCount: Number(data?.totalCount ?? data?.result?.totalCount ?? items.length),
      pageIndex: Number(data?.pageIndex ?? data?.result?.pageIndex ?? pageIndex),
      pageSize: Number(data?.pageSize ?? data?.result?.pageSize ?? pageSize),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
