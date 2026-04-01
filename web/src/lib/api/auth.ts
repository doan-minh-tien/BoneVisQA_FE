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

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  schoolCohort: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  try {
    const { data } = await http.post<RegisterResponse>('/api/Auths/register', payload);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
