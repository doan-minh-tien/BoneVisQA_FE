import Header from '@/components/Header';
import CaseCard from '@/components/student/CaseCard';
import CaseFilters from '@/components/student/cases/CaseFilters';

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



export default function StudentCaseLibraryPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Case Library"
        subtitle="Explore curated musculoskeletal imaging cases"
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Top bar: search + primary filters */}
        <CaseFilters />

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

