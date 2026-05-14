import { http } from './client';

export interface ExpertSpecialtyDto {
  id: string;
  expertId: string;
  expertName: string | null;
  expertEmail: string | null;
  boneSpecialtyId: string;
  boneSpecialtyName: string | null;
  boneSpecialtyCode: string | null;
  pathologyCategoryId: string | null;
  pathologyCategoryName: string | null;
  proficiencyLevel: number;
  yearsExperience: number | null;
  certifications: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// Alias kept for backward-compat (identical shape as ExpertSpecialtyPagedResult)
export type ExpertSpecialtyPagedResponse = ExpertSpecialtyPagedResult;

export interface ExpertSpecialtyCreateDto {
  boneSpecialtyId: string;
  pathologyCategoryId?: string | null;
  proficiencyLevel: number;
  yearsExperience?: number | null;
  certifications?: string | null;
  isPrimary: boolean;
}

export interface ExpertSpecialtyUpdateDto {
  id: string;
  boneSpecialtyId?: string;
  pathologyCategoryId?: string | null;
  proficiencyLevel?: number;
  yearsExperience?: number | null;
  certifications?: string | null;
  isPrimary?: boolean;
}

export interface ExpertSuggestionDto {
  expertId: string;
  expertName: string | null;
  expertEmail: string | null;
  boneSpecialtyId: string;
  boneSpecialtyName: string | null;
  proficiencyLevel: number;
  yearsExperience: number | null;
  certifications: string | null;
}

export interface ExpertSpecialtyPagedResult {
  items: ExpertSpecialtyDto[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function strOrNull(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v;
  return null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  return fallback;
}

/**
 * Map one row from BE (camelCase or PascalCase) so `id` is always set for DELETE/PUT by id.
 */
export function normalizeExpertSpecialtyDto(raw: unknown): ExpertSpecialtyDto | null {
  if (!isRecord(raw)) return null;
  const idVal = raw.id ?? raw.Id;
  if (typeof idVal !== 'string' || !idVal.trim()) return null;

  let proficiency = Number(raw.proficiencyLevel ?? raw.ProficiencyLevel);
  if (!Number.isFinite(proficiency) || proficiency < 1) proficiency = 1;
  if (proficiency > 5) proficiency = 5;

  const yearsRaw = raw.yearsExperience ?? raw.YearsExperience;
  const yearsNum = yearsRaw === null || yearsRaw === undefined ? NaN : Number(yearsRaw);
  const yearsExperience = Number.isFinite(yearsNum) ? yearsNum : null;

  return {
    id: idVal.trim(),
    expertId: str(raw.expertId ?? raw.ExpertId),
    expertName: strOrNull(raw.expertName ?? raw.ExpertName),
    expertEmail: strOrNull(raw.expertEmail ?? raw.ExpertEmail),
    boneSpecialtyId: str(raw.boneSpecialtyId ?? raw.BoneSpecialtyId),
    boneSpecialtyName: strOrNull(raw.boneSpecialtyName ?? raw.BoneSpecialtyName),
    boneSpecialtyCode: strOrNull(raw.boneSpecialtyCode ?? raw.BoneSpecialtyCode),
    pathologyCategoryId: strOrNull(raw.pathologyCategoryId ?? raw.PathologyCategoryId),
    pathologyCategoryName: strOrNull(raw.pathologyCategoryName ?? raw.PathologyCategoryName),
    proficiencyLevel: proficiency,
    yearsExperience,
    certifications: strOrNull(raw.certifications ?? raw.Certifications),
    isPrimary: Boolean(raw.isPrimary ?? raw.IsPrimary),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
    createdAt: strOrNull(raw.createdAt ?? raw.CreatedAt),
    updatedAt: strOrNull(raw.updatedAt ?? raw.UpdatedAt),
  };
}

/** `/my` may return a single object or an array. */
function normalizeExpertSpecialtyListPayload(data: unknown): ExpertSpecialtyDto[] {
  if (Array.isArray(data)) {
    return data.map(normalizeExpertSpecialtyDto).filter((x): x is ExpertSpecialtyDto => x !== null);
  }
  const one = normalizeExpertSpecialtyDto(data);
  return one ? [one] : [];
}

function normalizeExpertSpecialtyPaged(
  data: unknown,
  pageIndex: number,
  pageSize: number
): ExpertSpecialtyPagedResult {
  if (Array.isArray(data)) {
    const items = data.map(normalizeExpertSpecialtyDto).filter((x): x is ExpertSpecialtyDto => x !== null);
    return { items, totalCount: items.length, pageIndex, pageSize };
  }
  const d = data as Partial<ExpertSpecialtyPagedResult> & { Items?: unknown[]; TotalCount?: number };
  const rawItems = d.items ?? d.Items ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(normalizeExpertSpecialtyDto)
    .filter((x): x is ExpertSpecialtyDto => x !== null);
  return {
    items,
    totalCount: Number(d.totalCount ?? d.TotalCount ?? items.length),
    pageIndex: Number(d.pageIndex ?? pageIndex),
    pageSize: Number(d.pageSize ?? pageSize),
  };
}

export const expertSpecialtyApi = {
  // Lấy danh sách chuyên môn của Expert hiện tại (đúng id để update/delete; có thể là 1 object hoặc mảng)
  getMySpecialties: async (): Promise<ExpertSpecialtyDto[]> => {
    const response = await http.get<unknown>('/api/expert-specialties/my');
    return normalizeExpertSpecialtyListPayload(response.data);
  },

  /** Danh sách phân trang (contract BE: `items`, `totalCount`, `pageIndex`, `pageSize`). */
  getAllSpecialtiesPaged: async (
    pageIndex = 1,
    pageSize = 5
  ): Promise<ExpertSpecialtyPagedResult> => {
    const response = await http.get<ExpertSpecialtyPagedResult | ExpertSpecialtyDto[]>(
      '/api/expert-specialties/all',
      { params: { pageIndex, pageSize } }
    );
    return normalizeExpertSpecialtyPaged(response.data, pageIndex, pageSize);
  },

  /**
   * Lấy TẤT CẢ chuyên môn (không phân trang) – dùng pageSize lớn để lấy hết.
   * Component cũ dùng hàm này; nếu BE hỗ trợ endpoint riêng hãy thay thế.
   */
  getAllSpecialties: async (): Promise<ExpertSpecialtyDto[]> => {
    const response = await http.get<ExpertSpecialtyPagedResult | ExpertSpecialtyDto[]>(
      '/api/expert-specialties/all',
      { params: { pageIndex: 1, pageSize: 1000 } }
    );
    const normalized = normalizeExpertSpecialtyPaged(response.data, 1, 1000);
    return normalized.items;
  },

  // Lấy chi tiết một chuyên môn
  getById: async (id: string): Promise<ExpertSpecialtyDto> => {
    const response = await http.get<unknown>(`/api/expert-specialties/${id}`);
    const n = normalizeExpertSpecialtyDto(response.data);
    if (!n) throw new Error('Invalid specialty response from server.');
    return n;
  },

  // Tạo chuyên môn mới
  create: async (data: ExpertSpecialtyCreateDto): Promise<ExpertSpecialtyDto> => {
    const response = await http.post<unknown>('/api/expert-specialties', data);
    // BE có thể trả về object rỗng hoặc null khi 500 nhưng vẫn resolve
    const n = normalizeExpertSpecialtyDto(response.data);
    if (!n) throw new Error('Create succeeded but the response could not be read. Please refresh the list.');
    return n;
  },
  // Cập nhật chuyên môn
  update: async (data: ExpertSpecialtyUpdateDto): Promise<ExpertSpecialtyDto> => {
    const response = await http.put<unknown>('/api/expert-specialties', data);
    const n = normalizeExpertSpecialtyDto(response.data);
    if (!n) throw new Error('Update succeeded but the response could not be read. Please refresh the list.');
    return n;
  },

  // Xóa chuyên môn (soft delete)
  delete: async (id: string): Promise<void> => {
    await http.delete(`/api/expert-specialties/${id}`);
  },

  // Gợi ý Expert theo BoneSpecialty (dùng cho Lecturer)
  getSuggestedExperts: async (
    boneSpecialtyId: string,
    pathologyCategoryId?: string
  ): Promise<ExpertSuggestionDto[]> => {
    const params: Record<string, string> = { boneSpecialtyId };
    if (pathologyCategoryId) {
      params.pathologyCategoryId = pathologyCategoryId;
    }
    const response = await http.get<ExpertSuggestionDto[]>('/api/expert-specialties/suggest', { params });
    return response.data;
  },
};
