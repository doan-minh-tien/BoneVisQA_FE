'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { StudentHistoryPageSkeleton } from '@/components/shared/DashboardSkeletons';
import { SectionCard } from '@/components/shared/SectionCard';
import CaseCard from '@/components/student/CaseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchStudentCaseLibraryHistory, fetchStudentPersonalStudiesHistory } from '@/lib/api/student';
import type { StudentCaseHistoryItem } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { BookOpen, Filter, ImageUp, Search, Upload } from 'lucide-react';

const difficultyFilters = [
  { id: 'all', label: 'All levels' },
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

type HistoryTab = 'cases' | 'personal';

function tabFromSearch(raw: string | null): HistoryTab {
  return raw === 'personal' || raw === 'upload' ? 'personal' : 'cases';
}

export default function StudentHistoryPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = tabFromSearch(searchParams.get('tab'));

  const [caseItems, setCaseItems] = useState<StudentCaseHistoryItem[]>([]);
  const [personalItems, setPersonalItems] = useState<StudentCaseHistoryItem[]>([]);
  const [totalCaseCount, setTotalCaseCount] = useState(0);
  const [totalPersonalCount, setTotalPersonalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof difficultyFilters)[number]['id']>('all');

  const setTab = (tab: HistoryTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/student/history?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [personalResponse, caseResponse] = await Promise.all([
          fetchStudentPersonalStudiesHistory(),
          fetchStudentCaseLibraryHistory(),
        ]);
        if (!cancelled) {
          setPersonalItems(personalResponse.items);
          setCaseItems(caseResponse.items);
          setTotalPersonalCount(personalResponse.totalCount);
          setTotalCaseCount(caseResponse.totalCount);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load history.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const tabItems = useMemo(() => {
    return activeTab === 'cases' ? caseItems : personalItems;
  }, [activeTab, caseItems, personalItems]);

  useEffect(() => {
    if (activeTab !== 'cases') {
      setDifficulty('all');
      setSearch('');
    }
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (activeTab === 'personal') {
      // Personal Q&A rows come from session/chat history and do not carry case-library difficulty metadata.
      return tabItems;
    }
    return tabItems.filter((item) => {
      const matchesDifficulty = difficulty === 'all' || item.difficulty === difficulty;
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.boneLocation.toLowerCase().includes(needle) ||
        item.lesionType.toLowerCase().includes(needle);
      return matchesDifficulty && matchesSearch;
    });
  }, [activeTab, difficulty, tabItems, search]);

  const backendTotalForActiveTab = activeTab === 'cases' ? totalCaseCount : totalPersonalCount;

  const headerSubtitle =
    activeTab === 'cases'
      ? 'Expert-approved library cases you opened and worked through in Visual QA.'
      : 'Your own X-ray uploads and questions submitted through Visual QA (custom studies).';

  return (
    <div className="min-h-screen">
      <Header title="Learning history" subtitle={headerSubtitle} />

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setTab('cases')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'cases'
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
              Case studies
            </button>
            <button
              type="button"
              onClick={() => setTab('personal')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'personal'
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              <Upload className="h-4 w-4 shrink-0" aria-hidden />
              Personal Q&amp;A
            </button>
          </div>
          <p className="text-xs text-muted-foreground sm:ml-2 sm:max-w-xl">
            Tabs separate curated case-library work from uploads you brought into Visual QA. Personal sessions open in
            the same Visual QA workspace (<span className="font-mono text-[11px]">/student/qa/image</span>) so chat,
            image, and history stay in one place. Classification uses API fields when present, with light fallbacks when
            the server omits them.
          </p>
        </div>

        <SectionCard
          title={activeTab === 'cases' ? 'Case Library History' : 'Personal Q&A History'}
          description={
            activeTab === 'cases'
              ? 'Review your interactions on curated case-library studies.'
              : 'Review your custom Visual QA sessions, including your latest student question.'
          }
          className="p-4 md:p-5"
        >
          {activeTab === 'cases' ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-md">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-3 py-3 focus-within:ring-2 focus-within:ring-ring">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-auto grow border-0 bg-transparent p-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Search by title, region, or lesion type..."
                  />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'cases' ? (
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
          ) : null}
        </SectionCard>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground md:text-sm">
          <span>
            Showing <span className="font-medium text-card-foreground">{filtered.length}</span> entr
            {filtered.length === 1 ? 'y' : 'ies'} in this tab
            {backendTotalForActiveTab > 0 ? (
              <span className="ml-1 text-muted-foreground/80">(backend total: {backendTotalForActiveTab})</span>
            ) : null}
          </span>
          <span className="hidden md:inline">
            Green badges mean the answer was verified by a clinical expert.
          </span>
        </div>

        {loading ? (
          <StudentHistoryPageSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'cases' ? (
                <BookOpen className="h-6 w-6 text-primary" />
              ) : (
                <ImageUp className="h-6 w-6 text-primary" />
              )
            }
            title={activeTab === 'cases' ? 'No case study history yet' : 'No personal studies yet'}
            description={
              activeTab === 'cases'
                ? 'Open a case from the catalog and run Visual QA to build this timeline. You can also switch to Personal Q&A to see custom uploads.'
                : 'Upload an image and ask a question in Visual QA to see your personal Q&A sessions here. Library cases appear under Case studies.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-5">
            {filtered.map((item) => {
              const sid = item.sessionId?.trim();
              const detailHref = sid
                ? `/student/qa/image?sessionId=${encodeURIComponent(sid)}`
                : activeTab === 'cases' && item.catalogCaseId?.trim()
                  ? `/student/cases/${encodeURIComponent(item.catalogCaseId.trim())}`
                  : undefined;
              return (
                <CaseCard
                  key={item.id}
                  href={detailHref}
                  title={
                    item.lastQuestionAsked?.trim() ||
                    item.questionSnippet?.trim() ||
                    item.title
                  }
                  thumbnail={item.thumbnailUrl}
                  boneLocation={item.boneLocation}
                  lesionType={item.lesionType}
                  difficulty={item.difficulty}
                  duration={item.duration}
                  progress={item.progress}
                  status={item.status}
                  reviewState={item.reviewState}
                  lastResponderRole={item.lastResponderRole}
                  askedAt={item.askedAt ?? item.updatedAt ?? undefined}
                  keyImagingFindings={item.keyImagingFindings}
                  reflectiveQuestions={item.reflectiveQuestions}
                  rejectionReason={item.rejectionReason}
                  prefillSessionImage={
                    activeTab === 'personal' && sid
                      ? { sessionId: sid, imageUrl: item.thumbnailUrl }
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
