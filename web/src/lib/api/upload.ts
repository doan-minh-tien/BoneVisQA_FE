import { http, getApiErrorMessage } from './client';

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await http.post<{ url?: string; Url?: string }>(
      '/api/upload/image',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    const url = data?.url ?? data?.Url;
    if (!url) throw new Error('Upload failed: no URL returned');
    return url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}