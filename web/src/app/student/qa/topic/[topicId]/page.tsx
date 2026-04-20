'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export default function TopicChatPage() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={<Bot className="h-6 w-6 text-primary" />}
          title="Feature In Development"
          description="Topic Q&A mode is being upgraded for production-ready retrieval and clinical validation."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/student/history?tab=personal">
            <Button>Back to Personal Q&A History</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
