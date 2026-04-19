import { http, getApiErrorMessage } from '@/lib/api/client';

/**
 * Uploads a quiz question image via the backend API.
 * The backend uses Supabase Service Key for upload, bypassing RLS policies.
 */
export async function uploadExpertWorkbenchImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await http.post<{ url?: string; Url?: string; message?: string }>(
      '/api/expert/quiz-questions/upload-image',
      form
    );

    const url = data?.url ?? data?.Url;
    if (!url) {
      throw new Error(data?.message || 'Upload failed: no URL returned');
    }
    return url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
