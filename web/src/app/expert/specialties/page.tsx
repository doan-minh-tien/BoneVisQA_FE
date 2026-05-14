'use client';

import Header from '@/components/Header';
import ExpertSpecialtyManagement from '@/components/expert/specialties/ExpertSpecialtyManagement';

export default function ExpertSpecialtiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Specialty management"
        subtitle="Manage your bone specialties, proficiency levels, and certifications for reviews and assignments."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        <ExpertSpecialtyManagement />
      </div>
    </div>
  );
}
