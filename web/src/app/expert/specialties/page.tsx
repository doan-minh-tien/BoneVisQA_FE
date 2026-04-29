'use client';

import ExpertSpecialtyManagement from '@/components/expert/specialties/ExpertSpecialtyManagement';

export default function ExpertSpecialtiesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Specialties</h1>
        <p className="text-gray-500 mt-1">
          Manage your bone specialties and pathology categories for expert reviews.
        </p>
      </div>

      <ExpertSpecialtyManagement />
    </div>
  );
}
