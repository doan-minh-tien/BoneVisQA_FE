'use client';

import { Filter } from 'lucide-react';

type Props = {
  location: string;
  lesionType: string;
  difficulty: string;
  locations: string[];
  lesionTypes: string[];
  difficulties: string[];
  onLocationChange: (value: string) => void;
  onLesionTypeChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
};

export function CatalogFilter({
  location,
  lesionType,
  difficulty,
  locations,
  lesionTypes,
  difficulties,
  onLocationChange,
  onLesionTypeChange,
  onDifficultyChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalog filters</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-card-foreground">
            Location
          </label>
          <select
            id="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All locations</option>
            {locations.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lesionType" className="block text-sm font-medium text-card-foreground">
            Lesion Type
          </label>
          <select
            id="lesionType"
            value={lesionType}
            onChange={(e) => onLesionTypeChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All lesion types</option>
            {lesionTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-card-foreground">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All difficulty levels</option>
            {difficulties.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
