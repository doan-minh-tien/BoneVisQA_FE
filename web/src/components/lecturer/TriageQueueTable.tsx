import { AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableEmptyState } from '@/components/shared/TableEmptyState';
import type { LecturerTriageRow } from '@/lib/api/types';

function similarityRatio(raw: number): number {
  if (Number.isNaN(raw)) return 0;
  if (raw > 1) return Math.min(1, Math.max(0, raw / 100));
  return Math.min(1, Math.max(0, raw));
}

export function TriageQueueTable({
  classId,
  rows,
  loadingRows,
  escalatingId,
  onEscalate,
}: {
  classId: string;
  rows: LecturerTriageRow[];
  loadingRows: boolean;
  escalatingId: string | null;
  onEscalate: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-input/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Similarity</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!classId ? (
              <TableEmptyState
                icon={AlertTriangle}
                title="Choose a class scope"
                description="Select a lecturer class to load its diagnostic triage queue."
                colSpan={6}
              />
            ) : loadingRows ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <TableEmptyState
                icon={AlertTriangle}
                title="No diagnostic requests"
                description="This class does not currently have any requests waiting for lecturer triage."
                colSpan={6}
              />
            ) : (
              rows.map((row) => {
                const sim = similarityRatio(row.similarityScore);
                const simClass =
                  sim < 0.55
                    ? 'bg-destructive/15 text-destructive'
                    : sim < 0.72
                      ? 'bg-warning/15 text-warning'
                      : 'bg-success/15 text-success';

                return (
                  <tr key={row.id} className="even:bg-slate-50/55 transition-colors hover:bg-blue-50/70">
                    <td className="px-4 py-3 font-medium text-card-foreground">{row.studentName}</td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-2">{row.questionSnippet}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative h-14 w-20 overflow-hidden rounded-md border border-border bg-input">
                        {row.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            -
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{row.askedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${simClass}`}>
                        {(sim * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        className="!inline-flex !gap-1.5 !py-2 !text-xs"
                        variant="secondary"
                        disabled={row.escalated || escalatingId === row.id}
                        isLoading={escalatingId === row.id}
                        onClick={() => onEscalate(row.id)}
                      >
                        {row.escalated ? (
                          'Escalated'
                        ) : (
                          <>
                            <ArrowUpRight className="h-4 w-4" /> Escalate to Expert
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
