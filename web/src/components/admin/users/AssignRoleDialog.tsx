import { useState } from "react";
import { X, ChevronDown, Loader2, UserCheck } from "lucide-react";
import { User, Role } from "./types";

export default function AssignRoleDialog({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: (role: Role) => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("Student");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm(selectedRole);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800">Assign Role</h3>
          <p className="text-sm text-slate-500 mt-1">Approve this user and grant them access.</p>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
            {user.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              {user.name}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Role to Assign
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full h-12 pl-4 pr-10 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all shadow-sm"
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Expert">Expert</option>
              <option value="Admin">Admin</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-3">
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Confirm & Assign
          </button>
        </div>
      </div>
    </div>
  );
}
