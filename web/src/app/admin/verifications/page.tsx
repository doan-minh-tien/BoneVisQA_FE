'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useToast } from '@/components/ui/toast';
import {
  fetchPendingVerifications,
  approveMedicalVerification,
  type PendingVerification,
} from '@/lib/api/admin-users';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function MedicalVerificationsPage() {
  const toast = useToast();
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingVerification | null>(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const data = await fetchPendingVerifications();
      setVerifications(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load verifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setProcessing(selectedUser.userId);
    try {
      await approveMedicalVerification(selectedUser.userId, {
        isApproved: true,
        notes: notes || undefined,
      });
      toast.success(`${selectedUser.fullName} approved. Student role assigned, account activated.`);
      setVerifications((prev) => prev.filter((v) => v.userId !== selectedUser.userId));
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve verification.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    setProcessing(selectedUser.userId);
    try {
      await approveMedicalVerification(selectedUser.userId, {
        isApproved: false,
        notes: notes || 'Verification rejected by admin.',
      });
      toast.success(`Verification rejected for ${selectedUser.fullName}.`);
      setVerifications((prev) => prev.filter((v) => v.userId !== selectedUser.userId));
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject verification.');
    } finally {
      setProcessing(null);
    }
  };

  const openDialog = (user: PendingVerification, type: 'approve' | 'reject') => {
    setSelectedUser(user);
    setActionType(type);
    setNotes('');
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setActionType(null);
    setNotes('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title="Medical Student Verifications"
        subtitle="Review and approve medical student registration requests"
      />

      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Info Banner */}
        <div className="flex items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Medical Student Verification System
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Users who register as medical students will appear here for verification.
              Once approved, they will automatically receive the <strong>Student</strong> role,
              their account will be activated, and a welcome email will be sent — in a single step.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{verifications.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {verifications.filter((v) => v.medicalSchool).length}
                </p>
                <p className="text-sm text-muted-foreground">With Medical School Info</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {verifications.filter((v) => v.medicalStudentId).length}
                </p>
                <p className="text-sm text-muted-foreground">With Student ID</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Pending Verifications</h2>
          </div>

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No pending verifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All medical student verification requests have been processed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {verifications.map((verification) => (
                <div key={verification.userId} className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {verification.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{verification.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{verification.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">School Cohort</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {verification.schoolCohort || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Medical School</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {verification.medicalSchool || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Student ID</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {verification.medicalStudentId || 'N/A'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">Registered On</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDate(verification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          Pending Verification
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 lg:shrink-0">
                      <button
                        onClick={() => openDialog(verification, 'approve')}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => openDialog(verification, 'reject')}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {selectedUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  actionType === 'approve'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {actionType === 'approve' ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {actionType === 'approve' ? 'Approve' : 'Reject'} Verification
                </h3>
                <p className="text-sm text-muted-foreground">{selectedUser.fullName}</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-muted/50 p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-1 font-medium">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">School:</span>
                  <span className="ml-1 font-medium">{selectedUser.medicalSchool || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="ml-1 font-medium">{selectedUser.medicalStudentId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cohort:</span>
                  <span className="ml-1 font-medium">{selectedUser.schoolCohort || 'N/A'}</span>
                </div>
              </div>
            </div>

            {actionType === 'approve' ? (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Auto-assign:</strong> Upon approval, the user will be automatically assigned
                  the <strong>Student</strong> role, account activated, and receive a welcome email
                  with login credentials.
                </p>
              </div>
            ) : (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    The user will be notified via email about the rejection.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Notes {actionType === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Add approval notes (optional)...'
                    : 'Enter reason for rejection...'
                }
                rows={3}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDialog}
                disabled={processing !== null}
                className="flex-1 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={processing !== null || (actionType === 'reject' && !notes.trim())}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing === selectedUser.userId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : actionType === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
