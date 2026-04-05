import { http, getApiErrorMessage } from './client';

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  try {
    const { data } = await http.post<{ url?: string }>(
      '/api/upload/image',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (!data?.url) throw new Error('Upload failed: no URL returned');
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}