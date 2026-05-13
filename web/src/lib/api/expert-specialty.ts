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

export interface ExpertSpecialtyPagedResponse {
  items: ExpertSpecialtyDto[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

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

export const expertSpecialtyApi = {
  // Lấy danh sách chuyên môn của Expert hiện tại
  getMySpecialties: async (): Promise<ExpertSpecialtyDto[]> => {
    const response = await http.get<ExpertSpecialtyDto[]>('/api/expert-specialties/my');
    return response.data;
  },

  // Lấy tất cả chuyên môn của tất cả Expert (cho Admin) - không phân trang
  getAllSpecialties: async (): Promise<ExpertSpecialtyDto[]> => {
    const response = await http.get<ExpertSpecialtyDto[]>('/api/expert-specialties/all');
    return response.data;
  },

  // Lấy tất cả chuyên môn có phân trang (cho Admin)
  getAllSpecialtiesPaged: async (
    pageIndex = 1,
    pageSize = 10
  ): Promise<ExpertSpecialtyPagedResponse> => {
    const response = await http.get<ExpertSpecialtyPagedResponse>(
      `/api/expert-specialties/all?pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Lấy chi tiết một chuyên môn
  getById: async (id: string): Promise<ExpertSpecialtyDto> => {
    const response = await http.get<ExpertSpecialtyDto>(`/api/expert-specialties/${id}`);
    return response.data;
  },

  // Tạo chuyên môn mới
  create: async (data: ExpertSpecialtyCreateDto): Promise<ExpertSpecialtyDto> => {
    const response = await http.post<ExpertSpecialtyDto>('/api/expert-specialties', data);
    return response.data;
  },

  // Cập nhật chuyên môn
  update: async (data: ExpertSpecialtyUpdateDto): Promise<ExpertSpecialtyDto> => {
    const response = await http.put<ExpertSpecialtyDto>('/api/expert-specialties', data);
    return response.data;
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
