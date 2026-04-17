import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react';
import { isNextImageRemoteOptimized } from '@/lib/images/remote-image';

interface CaseCardProps {
  title: string;
  thumbnail?: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration?: string;
  progress?: number;
  status?: string;
  askedAt?: string;
  /** SEPS learning fields when returned by history API */
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  /** Lecturer rejection explanation when session was rejected (history list). */
  rejectionReason?: string | null;
  /** When set, the whole card links (e.g. catalog case detail). */
  href?: string;
}

const difficultyConfig = {
  basic: {
    color: 'text-success bg-success/10',
    label: 'Basic'
  },
  intermediate: {
    color: 'text-warning bg-warning/10',
    label: 'Intermediate'
  },
  advanced: {
    color: 'text-destructive bg-destructive/10',
    label: 'Advanced'
  }
};

export default function CaseCard({
  title,
  thumbnail,
  boneLocation,
  lesionType,
  difficulty,
  duration = '15 min',
  progress = 0,
  status,
  askedAt,
  keyImagingFindings,
  reflectiveQuestions,
  rejectionReason,
  href,
}: CaseCardProps) {
  const diffConfig = difficultyConfig[difficulty];
  const normalizedStatusKey = (status ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const reviewBadge =
    normalizedStatusKey === 'expertapproved' ||
    normalizedStatusKey === 'approved' ||
    normalizedStatusKey === 'revised'
      ? {
          label: 'Verified',
          className: 'border-success/30 bg-success/10 text-success',
          icon: CheckCircle2,
        }
      : normalizedStatusKey === 'pendingexpertreview' ||
          normalizedStatusKey === 'pendinglecturerreview'
        ? {
            label: 'Pending expert review',
            className:
              'border-slate-400/35 bg-slate-500/10 text-slate-700',
            icon: Clock,
          }
        : normalizedStatusKey === 'escalatedtoexpert'
          ? {
              label: 'Expert Reviewing',
              className: 'border-orange-400/40 bg-orange-500/10 text-orange-700',
              icon: ShieldAlert,
            }
          : normalizedStatusKey === 'active'
            ? {
                label: 'Chatting',
                className: 'border-blue-400/40 bg-blue-500/10 text-blue-700',
                icon: Clock,
              }
            : normalizedStatusKey === 'rejected'
              ? {
                  label: 'Rejected',
                  className: 'border-destructive/40 bg-destructive/10 text-destructive',
                  icon: ShieldAlert,
                }
          : normalizedStatusKey === 'pending' || normalizedStatusKey === 'pendingexpert'
            ? {
                label: 'Pending expert review',
                className: 'border-warning/30 bg-warning/10 text-warning',
                icon: Clock,
              }
            : null;
  const ReviewIcon = reviewBadge?.icon;

  const article = (
    <article className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            unoptimized={!isNextImageRemoteOptimized(thumbnail)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-30" />
          </div>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${diffConfig.color}`}>
            {diffConfig.label}
          </span>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {reviewBadge && ReviewIcon ? (
          <div
            className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${reviewBadge.className}`}
          >
            <ReviewIcon className="h-3.5 w-3.5" />
            {reviewBadge.label}
          </div>
        ) : null}

        {rejectionReason?.trim() ? (
          <p
            className="mb-3 line-clamp-4 rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-xs leading-relaxed text-destructive"
            title={rejectionReason.trim()}
          >
            <span className="font-semibold text-destructive/90">Lecturer note: </span>
            {rejectionReason.trim()}
          </p>
        ) : null}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
            {boneLocation}
          </span>
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">
            {lesionType}
          </span>
        </div>

        {keyImagingFindings?.trim() ? (
          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-card-foreground">Imaging: </span>
            {keyImagingFindings.trim()}
          </p>
        ) : null}
        {reflectiveQuestions?.trim() ? (
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{reflectiveQuestions.trim()}</p>
          </div>
        ) : null}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{askedAt || duration}</span>
          </div>
          {progress > 0 && (
            <div className="flex items-center gap-1 text-accent">
              <TrendingUp className="w-4 h-4" />
              <span>{progress}% complete</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );

  if (href?.trim()) {
    return (
      <Link href={href.trim()} className="block rounded-xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {article}
      </Link>
    );
  }

  return article;
}
