'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { fetchStudentPersonalStudiesHistory } from '@/lib/api/student';
import type { StudentCaseHistoryItem } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { cn } from '@/lib/utils';

const STORAGE_KEY_PREFIX = 'bonevisqa:vqa-prefill-image:';

export function stashSessionPrefillImage(sessionId: string, imageUrl: string | null | undefined) {
  const sid = sessionId?.trim();
  const url = imageUrl?.trim();
  if (!sid || !url || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + sid, url);
  } catch {
    /* quota / private mode */
  }
}

export function readAndClearSessionPrefillImage(sessionId: string): string | null {
  const sid = sessionId?.trim();
  if (!sid || typeof sessionStorage === 'undefined') return null;
  try {
    const k = STORAGE_KEY_PREFIX + sid;
    const v = sessionStorage.getItem(k);
    if (v) sessionStorage.removeItem(k);
    return v;
  } catch {
    return null;
  }
}

type Props = {
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  className?: string;
};

export function VisualQaSessionHistorySidebar({ selectedSessionId, onSelectSession, className }: Props) {
  const [items, setItems] = useState<StudentCaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchStudentPersonalStudiesHistory();
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load sessions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.updatedAt ?? a.askedAt ?? 0).getTime();
      const tb = new Date(b.updatedAt ?? b.askedAt ?? 0).getTime();
      return tb - ta;
    });
  }, [items]);

  return (
    <aside
      className={cn(
        'flex min-h-0 w-full flex-col border-border bg-muted/20 lg:w-[260px] lg:shrink-0 lg:border-r',
        className,
      )}
    >
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Chat history</p>
        <p className="text-xs text-muted-foreground">Personal Visual QA sessions</p>
      </div>
      <div className="app-scroll-y min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : error ? (
          <p className="px-3 py-4 text-xs text-destructive">{error}</p>
        ) : sorted.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No sessions yet. Start from History or upload here.</p>
        ) : (
          <ul className="divide-y divide-border/80 p-1">
            {sorted.map((row) => {
              const sid = row.sessionId?.trim() ?? row.id;
              const title =
                row.lastQuestionAsked?.trim() || row.questionSnippet?.trim() || row.title || 'Session';
              const rel = formatRelativeTime(row.updatedAt ?? row.askedAt ?? null);
              const active = selectedSessionId?.trim() === sid;
              return (
                <li key={sid}>
                  <button
                    type="button"
                    onClick={() => {
                      stashSessionPrefillImage(sid, row.thumbnailUrl);
                      onSelectSession(sid);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors',
                      active ? 'bg-primary/12 text-foreground' : 'hover:bg-muted/80 text-foreground/90',
                    )}
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary opacity-80" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-medium leading-snug">{title}</span>
                      {rel ? <span className="mt-0.5 block text-[10px] text-muted-foreground">{rel}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
