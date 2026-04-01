import { http, getApiErrorMessage } from './client';
import type { LoginResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await http.post<LoginResponse>('/api/Auths/login', {
      email,
      password,
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
