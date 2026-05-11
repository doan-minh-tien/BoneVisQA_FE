import { MessageSquare, User, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  id: string;
  studentName: string;
  caseTitle: string;
  /** When `null` or omitted with unknown title → personal upload session. */
  caseId?: string | null;
  question: string;
  aiAnswer: string;
  submittedAt: string;
  priority: 'high' | 'normal' | 'low';
  category: string;
}

const priorityConfig = {
  high: {
    ring: 'ring-destructive/25',
    badge: 'destructive' as const,
    label: 'High priority',
  },
  normal: {
    ring: 'ring-amber-500/20',
    badge: 'outline' as const,
    label: 'Normal',
  },
  low: {
    ring: 'ring-muted',
    badge: 'muted' as const,
    label: 'Low priority',
  },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isAdHocTitle(title: string): boolean {
  const t = title.trim();
  return !t || t.toLowerCase() === 'unknown case';
}

function isPersonalUpload(caseId: string | null | undefined, caseTitle: string): boolean {
  if (caseId === undefined) return isAdHocTitle(caseTitle);
  if (caseId === null) return true;
  return caseId.trim() === '';
}

export default function ReviewCard({
  id,
  studentName,
  caseTitle,
  caseId,
  question,
  aiAnswer,
  submittedAt,
  priority,
  category,
}: ReviewCardProps) {
  const config = priorityConfig[priority];
  const personal = isPersonalUpload(caseId, caseTitle);

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/60 bg-card/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        'ring-1',
        config.ring,
      )}
    >
      <CardHeader className="space-y-3 p-5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={config.badge}>{config.label}</Badge>
          <Badge variant="outline" className="font-normal">
            {category}
          </Badge>
          {personal ? (
            <Badge variant="accent" className="font-semibold">
              Personal Upload
            </Badge>
          ) : (
            <Badge variant="secondary">Case chat</Badge>
          )}
        </div>
        {personal ? (
          <p className="text-sm font-medium text-muted-foreground">Student-uploaded study (no catalog case)</p>
        ) : (
          <h3 className="font-semibold leading-snug text-card-foreground line-clamp-2">{caseTitle}</h3>
        )}
      </CardHeader>

      <CardContent className="space-y-4 p-5 pb-4 pt-0">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(studentName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{studentName}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{submittedAt}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-card-foreground">Student question</span>
          </div>
          <p className="line-clamp-2 pl-6 text-sm text-card-foreground">{question}</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/35 p-3 shadow-inner">
          <span className="text-xs font-medium text-muted-foreground">AI generated answer</span>
          <p className="mt-1 line-clamp-2 text-sm text-card-foreground">{aiAnswer}</p>
        </div>
      </CardContent>

      <div className="flex flex-wrap gap-2 border-t border-border/60 bg-muted/20 p-5 pt-4">
        <Button variant="default" className="flex-1 sm:flex-none" asChild>
          <Link href={`/expert/reviews?focus=${encodeURIComponent(id)}`} className="inline-flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Review</span>
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10" disabled aria-hidden>
          <CheckCircle className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10" disabled aria-hidden>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
