'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/lib/useLogout';

export default function PendingApprovalPage() {
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Waiting for Admin Approval
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Your account is currently assigned the Guest role. An Administrator needs to verify
            your credentials and assign a platform role before you can access protected workflows.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Please check back shortly or contact your institution admin for expedited approval.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={logout}
            >
              Log Out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
