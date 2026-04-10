import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { StudentCaseCatalogItem } from '@/lib/api/types';
import { isNextImageRemoteOptimized } from '@/lib/images/remote-image';

export function CaseCatalogCard({ item }: { item: StudentCaseCatalogItem }) {
  const href = `/student/cases/${encodeURIComponent(item.id)}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="relative h-52 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            unoptimized={!isNextImageRemoteOptimized(item.imageUrl)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-cyan-accent/20">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-30" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {item.location}
          </span>
          <span className="rounded-full bg-cyan-accent/10 px-2.5 py-1 text-xs font-medium text-cyan-accent">
            {item.lesionType}
          </span>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium capitalize text-success">
            {item.difficulty}
          </span>
        </div>
      </div>
    </Link>
  );
}
