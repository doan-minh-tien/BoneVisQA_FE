import React from 'react';
import ProgressRing from '@/components/student/ProgressRing';

interface OverallProgressCardProps {
  progress: number;
  completedCases: number;
  totalCases: number;
}

export default function OverallProgressCard({ progress, completedCases, totalCases }: OverallProgressCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Overall Progress</h2>
      <div className="flex flex-col items-center">
        <ProgressRing progress={progress} size={140} strokeWidth={10} />
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">{completedCases} of {totalCases} cases completed</p>
          <p className="text-xs text-muted-foreground mt-1">You&apos;re doing great!</p>
        </div>
      </div>
    </div>
  );
}
