'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import CaseCard from '@/components/student/CaseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchStudentCases } from '@/lib/api/student';
import type { StudentCaseHistoryItem } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { Filter, Loader2, Search } from 'lucide-react';

const difficultyFilters = [
  { id: 'all', label: 'All levels' },
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export default function StudentHistoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<StudentCaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof difficultyFilters)[number]['id']>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentCases();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load student case history.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesDifficulty = difficulty === 'all' || item.difficulty === difficulty;
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.boneLocation.toLowerCase().includes(needle) ||
        item.lesionType.toLowerCase().includes(needle);
      return matchesDifficulty && matchesSearch;
    });
  }, [difficulty, items, search]);

  return (
    <div className="min-h-screen">
      <Header
        title="Visual QA History"
        subtitle="Review your submitted cases and see whether a clinical expert has verified the result"
      />

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-md">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3 py-3 focus-within:ring-2 focus-within:ring-ring">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-auto grow border-0 bg-transparent p-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Search by question title, region, or lesion type..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" />
              Difficulty
            </span>
            <div className="flex flex-wrap gap-2">
              {difficultyFilters.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  size="sm"
                  variant={filter.id === difficulty ? 'primary' : 'outline'}
                  onClick={() => setDifficulty(filter.id)}
                  className="rounded-full"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground md:text-sm">
          <span>
            Showing <span className="font-medium text-card-foreground">{filtered.length}</span> submitted case
            {filtered.length === 1 ? '' : 's'}
          </span>
          <span className="hidden md:inline">
            Green badges mean the answer was verified by a clinical expert.
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading your Visual QA history...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-card-foreground">No history available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your submitted visual questions will appear here after the backend returns student case history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-5">
            {filtered.map((item) => (
              <CaseCard
                key={item.id}
                id={item.id}
                title={item.title}
                thumbnail={item.thumbnailUrl}
                boneLocation={item.boneLocation}
                lesionType={item.lesionType}
                difficulty={item.difficulty}
                duration={item.duration}
                progress={item.progress}
                status={item.status}
                askedAt={item.askedAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
