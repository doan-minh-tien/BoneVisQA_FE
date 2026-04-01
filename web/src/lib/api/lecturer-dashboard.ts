import { http, getApiErrorMessage } from './client';
import type { LecturerDashboardStats } from './types';

export async function fetchLecturerDashboardStats(): Promise<LecturerDashboardStats> {
  try {
    const { data } = await http.get<LecturerDashboardStats>('/api/lecturer/dashboard/stats');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
