import React, { useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import type { CaseDto } from '@/lib/api/types';
import { Button } from '@/components/ui/button';

const difficultyColors: Record<string, string> = {
  easy: 'bg-success/10 text-success',
  basic: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  intermediate: 'bg-warning/10 text-warning',
  hard: 'bg-destructive/10 text-destructive',
  advanced: 'bg-destructive/10 text-destructive',
};

interface CasesTableProps {
  cases: CaseDto[];
  selectedCases: Set<string>;
  onSelectAll: (allIds: Set<string>) => void;
  onSelect: (id: string) => void;
  onToggleApprove: (c: CaseDto) => void;
  togglingIds: Set<string>;
}

export default function CasesTable({
  cases,
  selectedCases,
  onSelectAll,
  onSelect,
  onToggleApprove,
  togglingIds,
}: CasesTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-slate-50/60">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={selectedCases.size === cases.length && cases.length > 0}
                onChange={() => {
                  if (selectedCases.size === cases.length) {
                    onSelectAll(new Set());
                  } else {
                    onSelectAll(new Set(cases.map((c) => c.id)));
                  }
                }}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              ID
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Title
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Category
            </th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Difficulty
            </th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Approved
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Created
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cases.map((c) => {
            const isToggling = togglingIds.has(c.id);
            return (
              <tr key={c.id} className="transition-colors even:bg-slate-50/40 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedCases.has(c.id)}
                    onChange={() => onSelect(c.id)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {c.id.slice(0, 8)}
                    </code>
                    <button
                      onClick={() => handleCopy(c.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy UUID"
                    >
                      {copiedId === c.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-card-foreground">
                    {c.title || 'Untitled'}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3">
                  {c.categoryName ? (
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded font-medium">
                      {c.categoryName}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {c.difficulty ? (
                    <span
                      className={`px-2.5 py-1 text-xs rounded font-medium ${
                        difficultyColors[c.difficulty.toLowerCase()] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {c.difficulty}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      c.isActive ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.isActive ? 'bg-success' : 'bg-muted-foreground'
                      }`}
                    />
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  {c.isApproved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                      <ShieldOff className="w-3.5 h-3.5" />
                      No
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    onClick={() => onToggleApprove(c)}
                    disabled={isToggling}
                    variant="outline"
                    size="sm"
                    className={c.isApproved ? '!text-warning' : '!text-success'}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : c.isApproved ? (
                      <ShieldOff className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    {isToggling ? '...' : c.isApproved ? 'Unapprove' : 'Approve'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
