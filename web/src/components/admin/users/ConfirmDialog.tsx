import { X, UserX, UserCheck, AlertTriangle } from "lucide-react";
import { User } from "./types";

export default function ConfirmDialog({
  user,
  action,
  onConfirm,
  onCancel,
}: {
  user: User;
  action: "activate" | "deactivate";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDeactivate = action === "deactivate";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDeactivate ? "bg-rose-50 border-8 border-rose-100/50" : "bg-emerald-50 border-8 border-emerald-100/50"}`}
        >
          {isDeactivate ? (
            <UserX className="w-8 h-8 text-rose-600" />
          ) : (
            <UserCheck className="w-8 h-8 text-emerald-600" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
          {isDeactivate ? "Deactivate User" : "Activate User"}
        </h3>
        <p className="text-sm text-slate-500 text-center mb-8 px-4">
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate{" "}
              <strong className="text-slate-900 font-bold">{user.name}</strong>?
              They will no longer be able to log in.
            </>
          ) : (
            <>
              Are you sure you want to activate{" "}
              <strong className="text-slate-900 font-bold">{user.name}</strong>?
              They will be able to log in and access the system.
            </>
          )}
        </p>

        {isDeactivate && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200/50 mb-8">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 font-medium">
              This action will immediately revoke access. The user can be
              reactivated later.
            </p>
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-md cursor-pointer transition-all active:scale-95 ${isDeactivate ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"}`}
          >
            {isDeactivate ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
