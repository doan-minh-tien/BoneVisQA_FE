import React from 'react';
import StudentPerformanceCard from '@/components/lecturer/StudentPerformanceCard';

interface NeedsAttentionStudent {
  studentName: string;
  studentId: string;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completedCases: number;
  totalCases: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'needs-attention';
}

interface NeedsAttentionCardProps {
  students: NeedsAttentionStudent[];
}

export default function NeedsAttentionCard({ students }: NeedsAttentionCardProps) {
  return (
    <div className="bg-card rounded-xl border border-destructive/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">Needs Attention</h2>
        <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded">
          {students.length} students
        </span>
      </div>
      <div className="space-y-3">
        {students.map((student, idx) => (
          <StudentPerformanceCard key={idx} {...student} />
        ))}
      </div>
    </div>
  );
}
