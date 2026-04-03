import React, { useState } from 'react';
import { X } from 'lucide-react';
import { assignCasesToClass } from '@/lib/api/lecturer';
import type { ClassItem } from '@/lib/api/types';

interface AssignCasesDialogProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedCases: Set<string>;
  classes: ClassItem[];
}

export default function AssignCasesDialog({
  onClose,
  onSuccess,
  selectedCases,
  classes,
}: AssignCasesDialogProps) {
  const [assignClassId, setAssignClassId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const handleAssign = async () => {
    if (!assignClassId || selectedCases.size === 0) {
      setAssignError('Please select a class and at least one case.');
      return;
    }
    setAssigning(true);
    setAssignError('');
    try {
      await assignCasesToClass(assignClassId, {
        caseIds: Array.from(selectedCases),
        isMandatory: true,
      });
      onSuccess();
    } catch {
      setAssignError('Failed to assign cases. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Assign Cases to Class</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCases.size} case(s) selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {assignError && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {assignError}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-card-foreground mb-1.5">
            Select Class
          </label>
          <select
            value={assignClassId}
            onChange={(e) => setAssignClassId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className} — {cls.semester}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
