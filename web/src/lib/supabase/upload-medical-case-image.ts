import { createClient } from '@/lib/supabase/client';

const BUCKET = 'medical-cases';

/**
 * Uploads a file to the public `medical-cases` bucket (same pattern as backend-stored URLs).
 * Requires RLS/policies that allow the browser client to insert (e.g. authenticated Supabase user or public upload policy).
 */
export async function uploadExpertWorkbenchImage(file: File): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for image upload.',
    );
  }

  const supabase = createClient();
  const ext =
    file.name && file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      : '.jpg';
  const safeExt = /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : '.jpg';
  const path = `expert-workbench/${crypto.randomUUID()}${safeExt}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Supabase storage upload failed');
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  if (!pub?.publicUrl) {
    throw new Error('Could not resolve public URL for uploaded image.');
  }
  return pub.publicUrl;
}
