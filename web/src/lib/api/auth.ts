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
  isMedicalStudent: boolean;
  medicalSchool?: string;
  medicalStudentId?: string;
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

export async function forgotPassword(email: string): Promise<RegisterResponse> {
  try {
    const { data } = await http.post<RegisterResponse>('/api/Auths/forgot-password', { email });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<RegisterResponse> {
  try {
    const { data } = await http.post<RegisterResponse>('/api/Auths/reset-password', {
      token,
      newPassword,
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function googleRegister(idToken: string): Promise<RegisterResponse> {
  try {
    const { data } = await http.post<RegisterResponse>('/api/Auths/google-register', { idToken });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface MedicalVerificationPayload {
  medicalSchool: string;
  medicalStudentId: string;
}

export async function requestMedicalVerification(
  payload: MedicalVerificationPayload,
  userId?: string,
): Promise<RegisterResponse> {
  try {
    const { data } = await http.post<RegisterResponse>(
      '/api/Auths/request-medical-verification',
      payload,
      userId ? { headers: { 'X-User-Id': userId } } : undefined,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
