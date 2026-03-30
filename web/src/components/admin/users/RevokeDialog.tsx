import { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import { User } from "./types";

export default function RevokeDialog({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

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
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-rose-50 border-8 border-rose-100/50">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
          Revoke User Roles
        </h3>
        <p className="text-sm text-slate-500 text-center mb-8 px-4">
          Are you sure you want to revoke roles for{" "}
          <strong className="text-slate-900 font-bold">{user.name}</strong>?
          They will be reverted to <strong className="text-amber-600">Pending</strong> state and lose access.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-md cursor-pointer transition-all active:scale-95 bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke Roles"}
          </button>
        </div>
      </div>
    </div>
  );
}
