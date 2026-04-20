import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { StudentCaseCatalogItem } from '@/lib/api/types';
import { isNextImageRemoteOptimized } from '@/lib/images/remote-image';
import { resolveApiAssetUrl } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';

function originLabel(origin: StudentCaseCatalogItem['caseOrigin']): string {
  return origin === 'communityPromoted' ? 'From Community Request' : 'Created by Expert';
}

function originBadgeClass(origin: StudentCaseCatalogItem['caseOrigin']): string {
  return origin === 'communityPromoted'
    ? 'border-violet-300 bg-violet-50 text-violet-900'
    : 'border-sky-300 bg-sky-50 text-sky-900';
}

export function CaseCatalogCard({ item }: { item: StudentCaseCatalogItem }) {
  const href = `/student/cases/${encodeURIComponent(item.id)}`;

  const createdLabel = item.createdAt
    ? (() => {
        const d = new Date(item.createdAt);
        return Number.isNaN(d.getTime()) ? item.createdAt : d.toLocaleDateString('vi-VN');
      })()
    : null;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="relative h-52 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={resolveApiAssetUrl(item.imageUrl)}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            unoptimized={!isNextImageRemoteOptimized(resolveApiAssetUrl(item.imageUrl))}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-cyan-accent/20">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-30" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${originBadgeClass(item.caseOrigin)}`}
          >
            {originLabel(item.caseOrigin)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        {createdLabel ? (
          <p className="mt-1 text-xs text-muted-foreground">Created: {createdLabel}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {item.location}
          </span>
          {item.categoryDisplay && item.categoryDisplay !== item.lesionType ? (
            <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {item.categoryDisplay}
            </span>
          ) : null}
          <span className="rounded-full bg-cyan-accent/10 px-2.5 py-1 text-xs font-medium text-cyan-accent">
            {item.lesionType}
          </span>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            {item.difficultyLabel}
          </span>
        </div>
        {item.tags && item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 6 ? (
              <span className="self-center text-[10px] text-muted-foreground">+{item.tags.length - 6}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
