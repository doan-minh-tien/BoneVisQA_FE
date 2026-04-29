'use client';

import { useState, useEffect } from 'react';
import { expertSpecialtyApi, ExpertSpecialtyDto, ExpertSpecialtyCreateDto } from '@/lib/api/expert-specialty';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function ExpertSpecialtyManagement({ onClose, onSuccess }: Props) {
  const [specialties, setSpecialties] = useState<ExpertSpecialtyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ExpertSpecialtyCreateDto>({
    boneSpecialtyId: '',
    proficiencyLevel: 1,
    isPrimary: false,
  });

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const data = await expertSpecialtyApi.getMySpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error('Failed to load specialties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expertSpecialtyApi.create(formData);
      setShowForm(false);
      loadSpecialties();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create specialty:', error);
      alert('Failed to create specialty');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    try {
      await expertSpecialtyApi.delete(id);
      loadSpecialties();
    } catch (error) {
      console.error('Failed to delete specialty:', error);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await expertSpecialtyApi.update({ id, isPrimary: true });
      loadSpecialties();
    } catch (error) {
      console.error('Failed to set primary:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Specialties</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : '+ Add Specialty'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded bg-gray-50">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bone Specialty ID *</label>
              <input
                type="text"
                required
                value={formData.boneSpecialtyId}
                onChange={(e) => setFormData({ ...formData, boneSpecialtyId: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter Bone Specialty UUID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pathology Category ID (optional)</label>
              <input
                type="text"
                value={formData.pathologyCategoryId || ''}
                onChange={(e) => setFormData({ ...formData, pathologyCategoryId: e.target.value || undefined })}
                className="w-full p-2 border rounded"
                placeholder="Enter Pathology Category UUID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Proficiency Level (1-5) *</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={formData.proficiencyLevel}
                onChange={(e) => setFormData({ ...formData, proficiencyLevel: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                value={formData.yearsExperience || ''}
                onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                />
                <span className="text-sm font-medium">Set as Primary Specialty</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {specialties.length === 0 ? (
        <p className="text-gray-500">No specialties registered yet.</p>
      ) : (
        <div className="space-y-3">
          {specialties.map((specialty) => (
            <div key={specialty.id} className="p-4 border rounded flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{specialty.boneSpecialtyName || specialty.boneSpecialtyId}</h3>
                  {specialty.isPrimary && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Primary</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Proficiency: {specialty.proficiencyLevel}/5
                  {specialty.yearsExperience && ` | Experience: ${specialty.yearsExperience} years`}
                </p>
                {specialty.pathologyCategoryName && (
                  <p className="text-sm text-gray-500">
                    Category: {specialty.pathologyCategoryName}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!specialty.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(specialty.id)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(specialty.id)}
                  className="text-red-500 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
