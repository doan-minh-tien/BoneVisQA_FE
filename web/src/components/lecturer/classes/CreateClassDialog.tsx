import React, { useState } from 'react';
import { createClass } from '@/lib/api/lecturer';
import type { ClassItem } from '@/lib/api/types';

interface CreateClassDialogProps {
  onClose: () => void;
  onSuccess: (createdClass: ClassItem) => void;
}

export default function CreateClassDialog({ onClose, onSuccess }: CreateClassDialogProps) {
  const [newClassName, setNewClassName] = useState('');
  const [newSemester, setNewSemester] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newSemester.trim()) {
      setCreateError('Please fill in all fields.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const userId = localStorage.getItem('userId') || '';
      const created = await createClass({
        className: newClassName.trim(),
        semester: newSemester.trim(),
        lecturerId: userId,
      });
      onSuccess(created);
      onClose();
    } catch {
      setCreateError('Failed to create class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-1">Create New Class</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in the details below to create a new class.
        </p>

        {createError && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {createError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Class Name
            </label>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Orthopedics - Class A"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Semester
            </label>
            <input
              type="text"
              value={newSemester}
              onChange={(e) => setNewSemester(e.target.value)}
              placeholder="e.g. Spring 2026"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateClass}
            disabled={creating}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </div>
    </div>
  );
}
