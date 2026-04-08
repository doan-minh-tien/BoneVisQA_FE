'use client';

import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { FolderCog } from 'lucide-react';

const EXPERT_LIBRARY_UPGRADE_MESSAGE =
  'T\u00ednh n\u0103ng Qu\u1ea3n l\u00fd Th\u01b0 vi\u1ec7n d\u00e0nh cho Chuy\u00ean gia \u0111ang \u0111\u01b0\u1ee3c n\u00e2ng c\u1ea5p.';

export default function ExpertQuizzesPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Quiz Management"
        subtitle="Expert library management is temporarily unavailable in this demo build."
      />
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <EmptyState
          icon={<FolderCog className="h-6 w-6 text-primary" />}
          title="Feature In Development"
          description={EXPERT_LIBRARY_UPGRADE_MESSAGE}
        />
      </div>
    </div>
  );
}
