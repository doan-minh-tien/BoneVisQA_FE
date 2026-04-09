import { http, getApiErrorMessage } from './client';
import type { ExpertProfile, ExpertProfileUpdatePayload } from './types';

/**
 * GET /api/expert/profile
 * Fetch current expert's profile.
 */
export async function fetchExpertProfile(): Promise<ExpertProfile> {
  try {
    const { data } = await http.get<ExpertProfile>('/api/expert/profile');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * PUT /api/expert/profile
 * Update current expert's profile.
 */
export async function updateExpertProfile(
  payload: ExpertProfileUpdatePayload,
): Promise<ExpertProfile> {
  try {
    const { data } = await http.put<ExpertProfile>('/api/expert/profile', payload);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
