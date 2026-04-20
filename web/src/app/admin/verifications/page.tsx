'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { TableEmptyState } from '@/components/shared/TableEmptyState';
import { UserManagementTableSkeleton } from '@/components/shared/DashboardSkeletons';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  approveMedicalVerification,
  fetchPendingVerifications,
  type PendingVerification,
} from '@/lib/api/admin-users';
import { BadgeCheck, Check, Loader2, X } from 'lucide-react';

function formatSubmittedAt(value: string | null): string {
  if (!value?.trim()) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminMedicalVerificationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<PendingVerification | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin', 'verifications', 'pending'],
    queryFn: fetchPendingVerifications,
  });

  useEffect(() => {
    if (listQuery.error) {
      toast.error(
        listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load verification requests.',
      );
    }
  }, [listQuery.error, toast]);

  const decisionMutation = useMutation({
    mutationFn: async (vars: { userId: string; isApproved: boolean; notes?: string }) =>
      approveMedicalVerification(vars.userId, { isApproved: vars.isApproved, notes: vars.notes?.trim() || undefined }),
    onSuccess: (_, vars) => {
      toast.success(vars.isApproved ? 'Medical student verification approved.' : 'Verification rejected.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications', 'pending'] });
      setRejectTarget(null);
      setRejectNotes('');
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Could not update verification.');
    },
  });

  const rows = listQuery.data ?? [];
  const loading = listQuery.isPending;
  const busyUserId = decisionMutation.isPending ? decisionMutation.variables?.userId ?? null : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 pb-10">
      <Header
        title="Medical Student Verification"
        subtitle="Review pending medical school credentials submitted by students before they access teaching content."
      />

      <SectionCard
        title="Pending requests"
        description="Approve to grant Student access with verified credentials, or reject with optional notes for the user."
      >
        {loading ? (
          <UserManagementTableSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Medical school</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Cohort</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <TableEmptyState
                    icon={BadgeCheck}
                    title="No pending verifications"
                    description="When students submit medical verification, they will appear here."
                    colSpan={8}
                  />
                ) : (
                  rows.map((row) => (
                    <tr key={row.userId} className="bg-card hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-card-foreground">{row.fullName || '—'}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3 text-card-foreground">{row.medicalSchool?.trim() || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-card-foreground">
                        {row.medicalStudentId?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.schoolCohort?.trim() || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.verificationStatus?.trim() || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatSubmittedAt(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-emerald-600/40 text-emerald-800 hover:bg-emerald-50"
                            disabled={busyUserId === row.userId}
                            onClick={() => decisionMutation.mutate({ userId: row.userId, isApproved: true })}
                          >
                            {busyUserId === row.userId && decisionMutation.variables?.isApproved ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Check className="h-4 w-4" aria-hidden />
                            )}
                            <span className="ml-1.5">Approve</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={busyUserId === row.userId}
                            onClick={() => {
                              setRejectTarget(row);
                              setRejectNotes('');
                            }}
                          >
                            <X className="h-4 w-4" aria-hidden />
                            <span className="ml-1.5">Reject</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={Boolean(rejectTarget)}
        title="Reject verification"
        onClose={() => {
          if (!decisionMutation.isPending) {
            setRejectTarget(null);
            setRejectNotes('');
          }
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={decisionMutation.isPending}
              onClick={() => {
                setRejectTarget(null);
                setRejectNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!rejectTarget || decisionMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return;
                decisionMutation.mutate({
                  userId: rejectTarget.userId,
                  isApproved: false,
                  notes: rejectNotes,
                });
              }}
            >
              {decisionMutation.isPending && decisionMutation.variables?.isApproved === false ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              <span className={decisionMutation.isPending ? 'ml-2' : ''}>Confirm reject</span>
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Optional notes are stored with the decision and may be shown to the student depending on backend policy.
        </p>
        <label className="mt-4 block text-sm font-medium text-card-foreground" htmlFor="reject-notes">
          Notes (optional)
        </label>
        <textarea
          id="reject-notes"
          rows={4}
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Reason for rejection…"
          disabled={decisionMutation.isPending}
        />
      </Modal>
    </div>
  );
}
