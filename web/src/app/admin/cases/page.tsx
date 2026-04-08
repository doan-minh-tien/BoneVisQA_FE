'use client';

import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { FolderCog } from 'lucide-react';

const ADMIN_CASES_SYNC_MESSAGE =
  'H\u1ec7 th\u1ed1ng Qu\u1ea3n l\u00fd Ca b\u1ec7nh Admin \u0111ang \u0111\u01b0\u1ee3c \u0111\u1ed3ng b\u1ed9.';

export default function AdminCasesPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Case Management"
        subtitle="Admin case-management module is being synchronized with backend services."
      />
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <EmptyState
          icon={<FolderCog className="h-6 w-6 text-primary" />}
          title="Feature In Development"
          description={ADMIN_CASES_SYNC_MESSAGE}
        />
      </div>
    </div>
  );
}
