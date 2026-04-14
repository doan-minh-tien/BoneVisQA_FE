'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Loader2, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  assignUserToClass,
  fetchAvailableClasses,
  fetchUserClasses,
  removeUserFromClass,
  type AvailableClass,
  type ClassEnrollmentRelation,
  type UserClassInfo,
} from '@/lib/api/admin-users';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UiUser } from '../UserManagementTable';

interface ManageClassesDialogProps {
  user: UiUser;
  onCancel: () => void;
  onUpdated: (userId: string, updatedClasses: UserClassInfo[]) => void;
}

function enrollmentRelationForUserRole(user: UiUser): ClassEnrollmentRelation {
  if (user.role === 'Lecturer') return 'Lecturer';
  if (user.role === 'Expert') return 'Expert';
  return 'Student';
}

function roleLabel(user: UiUser): string {
  if (user.role === 'Lecturer') return 'Lecturer';
  if (user.role === 'Expert') return 'Expert';
  return 'Student';
}

export function ManageClassesDialog({ user, onCancel, onUpdated }: ManageClassesDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const userClassesQuery = useQuery({
    queryKey: ['admin', 'userClasses', user.id],
    queryFn: () => fetchUserClasses(user.id),
  });

  const classesCatalogQuery = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: fetchAvailableClasses,
  });

  const userClasses = userClassesQuery.data ?? [];
  const availableClasses = classesCatalogQuery.data ?? [];

  const loading = userClassesQuery.isPending || classesCatalogQuery.isPending;
  const loadError = useMemo(() => {
    const e = userClassesQuery.error ?? classesCatalogQuery.error;
    return e instanceof Error ? e.message : null;
  }, [userClassesQuery.error, classesCatalogQuery.error]);

  const catalogWarning =
    !loading && !loadError && availableClasses.length === 0
      ? 'No classes returned from GET /api/admin/classes. Create classes in admin or check API access.'
      : null;

  const assignedClassIds = new Set(userClasses.map((c) => c.id));
  const unassigned = availableClasses.filter(
    (c) =>
      !assignedClassIds.has(c.id) && c.className.toLowerCase().includes(search.toLowerCase()),
  );

  const assignMutation = useMutation({
    mutationFn: async ({ classId, className }: { classId: string; className: string }) => {
      const relation = enrollmentRelationForUserRole(user);
      return assignUserToClass(user.id, classId, { relation, className });
    },
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (added) => {
      toast.success('Assigned successfully.');
      queryClient.setQueryData<UserClassInfo[]>(['admin', 'userClasses', user.id], (old) => {
        const next = [...(old ?? []), added];
        onUpdated(user.id, next);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    },
    onError: (e: Error) => {
      setActionError(e.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ classId, relation }: { classId: string; relation: ClassEnrollmentRelation }) => {
      await removeUserFromClass(user.id, classId, relation);
    },
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<UserClassInfo[]>(['admin', 'userClasses', user.id], (old) => {
        const next = (old ?? []).filter((c) => c.id !== variables.classId);
        onUpdated(user.id, next);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e: Error) => {
      setActionError(e.message);
    },
  });

  const handleAssign = (classId: string, className: string) => {
    setSubmittingId(classId);
    assignMutation.mutate(
      { classId, className },
      {
        onSettled: () => setSubmittingId(null),
      },
    );
  };

  const handleRemove = (classId: string, relation: ClassEnrollmentRelation) => {
    setSubmittingId(classId);
    removeMutation.mutate(
      { classId, relation },
      {
        onSettled: () => setSubmittingId(null),
      },
    );
  };

  const isLecturer = user.role === 'Lecturer';
  const isExpert = user.role === 'Expert';

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-[150] bg-background/80 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[151] flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
        >
          <Dialog.Description className="sr-only">
            Assign or remove {user.name} from classes based on their role.
          </Dialog.Description>

          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-lg font-bold text-card-foreground">Manage classes</Dialog.Title>
                <p className="truncate text-sm text-muted-foreground">
                  {user.name} — {roleLabel(user)}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" className="!h-9 !w-9 shrink-0 !p-0" aria-label="Close">
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Dialog.Close>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-6 py-4',
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50 hover:scrollbar-thumb-border',
            )}
          >
            {loadError ? (
              <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                {loadError}
              </div>
            ) : null}

            {catalogWarning ? (
              <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                {catalogWarning}
              </div>
            ) : null}

            {actionError ? (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned ({userClasses.length})
                  </p>
                  {userClasses.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                      No classes assigned yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-card-foreground"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span className="max-w-[10rem] truncate">{cls.className}</span>
                          {cls.relationType === 'Lecturer' ? (
                            <span className="text-[10px] text-muted-foreground">(Lecturer)</span>
                          ) : null}
                          {cls.relationType === 'Expert' ? (
                            <span className="text-[10px] text-muted-foreground">(Expert)</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void handleRemove(cls.id, cls.relationType)}
                            disabled={submittingId === cls.id}
                            className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
                            aria-label={`Remove ${cls.className}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available to assign
                  </p>
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search classes…"
                      className="h-10 w-full rounded-xl border border-border bg-input pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2">
                    {unassigned.length === 0 ? (
                      <p className="py-3 text-center text-sm text-muted-foreground">No matching classes.</p>
                    ) : (
                      unassigned.map((cls: AvailableClass) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-card-foreground">
                              {cls.className}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isLecturer
                                ? `Lecturer: ${cls.lecturerName ?? '—'}`
                                : isExpert
                                  ? 'Assign as class expert'
                                  : `${cls.studentCount} student${cls.studentCount !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleAssign(cls.id, cls.className)}
                            disabled={submittingId === cls.id}
                            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {submittingId === cls.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Assign
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-6 py-4">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto sm:min-w-[7rem]">
                Done
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
