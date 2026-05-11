import { http, getApiErrorMessage } from './client';

export type UserProfileDto = {
  fullName?: string | null;
  email?: string | null;
  activeRole?: string | null;
  role?: string | null;
  roles?: string[] | null;
  status?: string | null;
  userStatus?: string | null;
  schoolCohort?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
};

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  type?: string;
  href: string;
};

function buildDefaultHref(type: string | undefined): string {
  const key = (type ?? '').toLowerCase();
  if (key.includes('quiz')) return '/student/quiz';
  if (key.includes('assignment')) return '/student/assignments';
  if (key.includes('analytics')) return '/student/analytics';
  if (key.includes('case')) return '/student/history?tab=cases';
  if (key.includes('question')) return '/student/history?tab=personal';
  if (key.includes('document')) return '/admin/documents';
  return '/';
}

/** Backend sometimes returns app paths without the `/student` prefix. */
function normalizeSearchHref(href: string): string {
  const t = href.trim();
  if (!t.startsWith('/')) return t;
  if (t === '/assignments' || t.startsWith('/assignments?')) return `/student${t}`;
  if (t === '/analytics' || t.startsWith('/analytics?')) return `/student${t}`;
  return t;
}

function mapSearchItem(row: unknown, idx: number): SearchResultItem | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const title = String(r.title ?? r.name ?? r.label ?? '').trim();
  if (!title) return null;
  const type = String(r.type ?? r.group ?? r.entity ?? '').trim() || undefined;
  const route = String(r.route ?? r.href ?? r.url ?? '').trim();
  return {
    id: String(r.id ?? r.key ?? `${type ?? 'result'}-${idx}`),
    title,
    subtitle: r.subtitle != null ? String(r.subtitle) : r.description != null ? String(r.description) : undefined,
    type,
    href: route ? normalizeSearchHref(route) : buildDefaultHref(type),
  };
}

/** Canonical current user profile — `GET /api/profile`. */
export async function fetchMyProfile(): Promise<UserProfileDto> {
  try {
    const { data } = await http.get<UserProfileDto>('/api/profile', { skipApiToast: true });
    return data ?? {};
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export const fetchCurrentUser = fetchMyProfile;

/** Payload for `PUT /api/profile` — include only fields the user may edit. */
export type UpdateUserMePayload = {
  fullName?: string;
  schoolCohort?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  address?: string | null;
};

export async function updateMyProfile(payload: UpdateUserMePayload): Promise<UserProfileDto> {
  try {
    const { data } = await http.put<UserProfileDto>('/api/profile', payload);
    return data ?? {};
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function uploadMyAvatar(file: File): Promise<{ avatarUrl: string }> {
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post<unknown>('/api/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = data as Record<string, unknown> | undefined;
    const avatarUrl =
      payload?.avatarUrl != null
        ? String(payload.avatarUrl)
        : payload?.url != null
          ? String(payload.url)
          : '';
    if (!avatarUrl) throw new Error('Avatar URL was not returned by the server.');
    return { avatarUrl };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function searchGlobal(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const { data } = await http.get<unknown>('/api/search', { params: { q } });
    let list: unknown[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.items)) {
        list = obj.items;
      } else if (obj.results && typeof obj.results === 'object') {
        const grouped = obj.results as Record<string, unknown>;
        list = Object.entries(grouped).flatMap(([group, entries]) =>
          Array.isArray(entries)
            ? entries.map((entry) =>
                entry && typeof entry === 'object'
                  ? { group, ...(entry as Record<string, unknown>) }
                  : entry,
              )
            : [],
        );
      }
    }
    return list.map(mapSearchItem).filter((item): item is SearchResultItem => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
