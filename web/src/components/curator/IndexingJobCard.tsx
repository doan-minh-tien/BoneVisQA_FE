import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';

interface IndexingJobCardProps {
  id: string;
  documentTitle: string;
  status: 'completed' | 'in-progress' | 'failed' | 'queued';
  startedAt: string;
  duration: string;
  chunksProcessed: number;
  totalChunks: number;
  errorMessage?: string;
}

const statusConfig = {
  completed: {
    color: 'bg-success/10 text-success',
    icon: CheckCircle,
    label: 'Completed',
    barColor: 'bg-success',
  },
  'in-progress': {
    color: 'bg-primary/10 text-primary',
    icon: Loader2,
    label: 'In Progress',
    barColor: 'bg-primary',
  },
  failed: {
    color: 'bg-destructive/10 text-destructive',
    icon: XCircle,
    label: 'Failed',
    barColor: 'bg-destructive',
  },
  queued: {
    color: 'bg-muted/50 text-muted-foreground',
    icon: Clock,
    label: 'Queued',
    barColor: 'bg-muted-foreground',
  },
};

export default function IndexingJobCard({
  documentTitle,
  status,
  startedAt,
  duration,
  chunksProcessed,
  totalChunks,
  errorMessage,
}: IndexingJobCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const progress = totalChunks > 0 ? (chunksProcessed / totalChunks) * 100 : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-card-foreground text-sm line-clamp-1">
            {documentTitle}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{startedAt}</span>
            <span>·</span>
            <span>{duration}</span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0 ${config.color}`}>
          <StatusIcon className={`w-3 h-3 ${status === 'in-progress' ? 'animate-spin' : ''}`} />
          {config.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {chunksProcessed}/{totalChunks} chunks
          </span>
          <span className="text-xs font-medium text-card-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-2 p-2 bg-destructive/5 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
