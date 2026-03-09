import Header from '@/components/Header';
import CaseCard from '@/components/student/CaseCard';
import { Filter, Grid3X3, ListFilter, Search } from 'lucide-react';

const cases = [
  {
    id: '1',
    title: 'Distal Radius Fracture - Case Study',
    thumbnail: '/cases/case1.jpg',
    boneLocation: 'Wrist',
    lesionType: 'Fracture',
    difficulty: 'basic' as const,
    duration: '12 min',
    progress: 75,
  },
  {
    id: '2',
    title: 'Osteoarthritis of the Knee Joint',
    thumbnail: '/cases/case2.jpg',
    boneLocation: 'Knee',
    lesionType: 'Degenerative',
    difficulty: 'intermediate' as const,
    duration: '18 min',
    progress: 45,
  },
  {
    id: '3',
    title: 'Complex Tibial Plateau Fracture',
    thumbnail: '/cases/case3.jpg',
    boneLocation: 'Tibia',
    lesionType: 'Fracture',
    difficulty: 'advanced' as const,
    duration: '25 min',
    progress: 0,
  },
  {
    id: '4',
    title: 'Shoulder Dislocation Analysis',
    thumbnail: '/cases/case4.jpg',
    boneLocation: 'Shoulder',
    lesionType: 'Dislocation',
    difficulty: 'intermediate' as const,
    duration: '15 min',
    progress: 100,
  },
  {
    id: '5',
    title: 'Lumbar Spine Compression Fracture',
    thumbnail: '/cases/case5.jpg',
    boneLocation: 'Spine',
    lesionType: 'Fracture',
    difficulty: 'advanced' as const,
    duration: '22 min',
    progress: 30,
  },
  {
    id: '6',
    title: 'Osteosarcoma of the Distal Femur',
    thumbnail: '/cases/case6.jpg',
    boneLocation: 'Femur',
    lesionType: 'Tumor',
    difficulty: 'advanced' as const,
    duration: '28 min',
    progress: 0,
  },
  {
    id: '7',
    title: 'Hip Osteoarthritis - Preoperative Planning',
    thumbnail: '/cases/case7.jpg',
    boneLocation: 'Hip',
    lesionType: 'Degenerative',
    difficulty: 'intermediate' as const,
    duration: '20 min',
    progress: 10,
  },
  {
    id: '8',
    title: 'Clavicle Midshaft Fracture',
    thumbnail: '/cases/case8.jpg',
    boneLocation: 'Clavicle',
    lesionType: 'Fracture',
    difficulty: 'basic' as const,
    duration: '10 min',
    progress: 60,
  },
];

const difficultyFilters = [
  { id: 'all', label: 'All levels' },
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const regionFilters = [
  'All regions',
  'Upper Limb',
  'Lower Limb',
  'Spine',
  'Pelvis',
];

export default function StudentCaseLibraryPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Case Library"
        subtitle="Explore curated musculoskeletal imaging cases"
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Top bar: search + primary filters */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="w-full md:max-w-md">
              <label className="input input-bordered flex items-center gap-2 bg-input border-border focus-within:ring-2 focus-within:ring-ring">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  className="grow bg-transparent outline-none"
                  placeholder="Search by title, region, lesion type..."
                />
              </label>
            </div>

            {/* View & sort controls (static for now) */}
            <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-sm btn-ghost gap-2 text-muted-foreground"
                  type="button"
                >
                  <ListFilter className="w-4 h-4" />
                  Filters
                </button>
                <button
                  className="btn btn-sm btn-outline gap-2 border-border"
                  type="button"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Grid view
                </button>
              </div>
              <select className="select select-sm select-bordered bg-input border-border text-sm">
                <option>Sort by Recommended</option>
                <option>Sort by Difficulty</option>
                <option>Sort by Duration</option>
                <option>Sort by Progress</option>
              </select>
            </div>
          </div>

          {/* Difficulty pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Difficulty
            </span>
            <div className="flex flex-wrap gap-2">
              {difficultyFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`btn btn-xs rounded-full border-border bg-muted/40 text-xs ${
                    filter.id === 'all'
                      ? 'btn-primary text-primary-content'
                      : 'btn-ghost text-muted-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region select */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Region
            </span>
            <div className="flex flex-wrap gap-2">
              {regionFilters.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={`btn btn-xs rounded-full border-border bg-muted/40 text-xs ${
                    region === 'All regions'
                      ? 'btn-outline border-primary/40 text-primary'
                      : 'btn-ghost text-muted-foreground'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result summary */}
        <div className="flex items-center justify-between gap-2 text-xs md:text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-card-foreground">{cases.length}</span> cases
            • Filters are static demo – hook to API later
          </span>
          <span className="hidden md:inline">
            Tip: start with <span className="font-medium text-primary">Basic</span> cases to build confidence.
          </span>
        </div>

        {/* Case grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
          {cases.map((case_) => (
            <CaseCard key={case_.id} {...case_} />
          ))}
        </div>
      </div>
    </div>
  );
}

