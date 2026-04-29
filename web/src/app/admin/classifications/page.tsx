'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import { useToast } from '@/components/ui/toast';
import boneSpecialtyApi, { type BoneSpecialtyDto } from '@/lib/api/admin-bone-specialty';
import pathologyCategoryApi, { type PathologyCategoryDto } from '@/lib/api/admin-pathology-category';
import {
  ChevronRight,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Bone,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type Tab = 'bone' | 'pathology';

interface FormState {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string | null;
  boneSpecialtyId?: string | null;
}

export default function AdminClassificationsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('bone');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Helper to invalidate and refetch all classification queries
  const invalidateClassificationQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'bone-specialties-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'bone-specialties-flat'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'pathology-categories'] }),
    ]);
  };

  // Force refresh by resetting queries to refetch
  const forceRefresh = async () => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries();
    // Clear and refetch
    await queryClient.invalidateQueries();
    // Force refetch all active queries
    await queryClient.refetchQueries({ type: 'active' });
  };
  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const { data: boneSpecialties = [], isPending: loadingBone } = useQuery({
    queryKey: ['admin', 'bone-specialties-tree'],
    queryFn: () => boneSpecialtyApi.getTree(),
  });

  const { data: pathologyCategories = [], isPending: loadingPathology } = useQuery({
    queryKey: ['admin', 'pathology-categories'],
    queryFn: () => pathologyCategoryApi.getAll({}),
  });

  const { data: allBoneSpecialties = [] } = useQuery({
    queryKey: ['admin', 'bone-specialties-flat'],
    queryFn: () => boneSpecialtyApi.getAll({ flat: true }),
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  // Filter bone specialties by status
  const filterBoneSpecialties = (items: BoneSpecialtyDto[]): BoneSpecialtyDto[] => {
    if (statusFilter === 'all') return items;
    
    const filterRecursively = (list: BoneSpecialtyDto[]): BoneSpecialtyDto[] => {
      return list
        .filter(item => {
          if (statusFilter === 'active') return item.isActive;
          if (statusFilter === 'inactive') return !item.isActive;
          return true;
        })
        .map(item => ({
          ...item,
          children: filterRecursively(item.children)
        }))
        .filter(item => item.isActive || item.children.length > 0 || statusFilter === 'inactive');
    };
    
    return filterRecursively(items);
  };

  const filteredBoneSpecialties = filterBoneSpecialties(boneSpecialties);

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.code || !form.name) {
      toast.error('Code and Name are required.');
      return;
    }

    try {
      if (activeTab === 'bone') {
        await boneSpecialtyApi.create({
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
          parentId: form.parentId || undefined,
        });
      } else {
        await pathologyCategoryApi.create({
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
          boneSpecialtyId: form.boneSpecialtyId || undefined,
        });
      }
      toast.success(`${activeTab === 'bone' ? 'Bone Specialty' : 'Pathology Category'} created successfully.`);
      resetForm();
      await invalidateClassificationQueries();
      await forceRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create.');
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !form.code || !form.name) {
      toast.error('ID, Code, and Name are required.');
      return;
    }

    try {
      if (activeTab === 'bone') {
        await boneSpecialtyApi.update({
          id: editingId,
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
          parentId: form.parentId || undefined,
        });
      } else {
        await pathologyCategoryApi.update({
          id: editingId,
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
          boneSpecialtyId: form.boneSpecialtyId || undefined,
        });
      }
      toast.success(`${activeTab === 'bone' ? 'Bone Specialty' : 'Pathology Category'} updated successfully.`);
      resetForm();
      await invalidateClassificationQueries();
      await forceRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'bone') {
        await boneSpecialtyApi.delete(id);
      } else {
        await pathologyCategoryApi.delete(id);
      }
      toast.success('Deleted successfully.');
      await invalidateClassificationQueries();
      await forceRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleToggleActive = async (item: BoneSpecialtyDto | PathologyCategoryDto) => {
    try {
      if (activeTab === 'bone') {
        await boneSpecialtyApi.toggleActive(item.id, !item.isActive);
      } else {
        await pathologyCategoryApi.toggleActive(item.id, !item.isActive);
      }
      await invalidateClassificationQueries();
      await forceRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const startEdit = (item: BoneSpecialtyDto | PathologyCategoryDto) => {
    setEditingId(item.id);
    setIsCreating(false);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description || '',
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      parentId: 'parentId' in item ? item.parentId : null,
      boneSpecialtyId: 'boneSpecialtyId' in item ? item.boneSpecialtyId : null,
    });
  };

  const renderBoneTree = (items: BoneSpecialtyDto[], level = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 border-b border-border/50 px-4 py-3 hover:bg-muted/30 transition-colors ${
            !item.isActive ? 'opacity-60' : ''
          }`}
          style={{ paddingLeft: `${1 + level * 1.5}rem` }}
        >
          {item.children.length > 0 && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="p-1 hover:bg-muted rounded"
            >
              {expanded.has(item.id) ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          {item.children.length === 0 && <div className="w-6" />}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${level === 0 ? 'text-primary' : 'text-foreground'}`}>
                {item.name}
              </span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {item.code}
              </span>
              {level > 0 && (
                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded text-secondary-foreground">
                  Level {level}
                </span>
              )}
              {!item.isActive && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleActive(item)}
              className="p-2 hover:bg-muted rounded-lg"
              title={item.isActive ? 'Deactivate' : 'Activate'}
            >
              {item.isActive ? (
                <ToggleRight className="w-5 h-5 text-green-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => startEdit(item)}
              className="p-2 hover:bg-muted rounded-lg"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 hover:bg-muted rounded-lg"
              title="Delete"
              disabled={item.children.length > 0}
            >
              <Trash2 className={`w-4 h-4 ${item.children.length > 0 ? 'text-muted-foreground/30' : 'text-red-500'}`} />
            </button>
          </div>
        </div>
        {expanded.has(item.id) && item.children.length > 0 && (
          <div className="bg-muted/20">
            {renderBoneTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const isLoading = activeTab === 'bone' ? loadingBone : loadingPathology;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title={t('classifications.title', 'Classification Management')}
        subtitle="Manage bone specialties and pathology categories"
      />

      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('bone')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'bone'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bone className="w-4 h-4" />
            Bone Specialties
          </button>
          <button
            onClick={() => setActiveTab('pathology')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'pathology'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Pathology Categories
          </button>
        </div>

        {/* Status Filter Tabs */}
        {activeTab === 'bone' && (
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <ToggleRight className="w-4 h-4" />
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <ToggleLeft className="w-4 h-4" />
              Inactive
            </button>
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit' : isCreating ? 'Create New' : `${activeTab === 'bone' ? 'Bone Specialty' : 'Pathology Category'}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., SHOULDER"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Shoulder Complex"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {activeTab === 'bone' && (
              <div>
                <label className="block text-sm font-medium mb-1">Parent Specialty</label>
                <select
                  value={form.parentId || ''}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Root (No Parent) --</option>
                  {allBoneSpecialties
                    .filter((s) => s.id !== editingId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>
            )}
            {activeTab === 'pathology' && (
              <div>
                <label className="block text-sm font-medium mb-1">Bone Specialty</label>
                <select
                  value={form.boneSpecialtyId || ''}
                  onChange={(e) => setForm({ ...form, boneSpecialtyId: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- General (All Specialties) --</option>
                  {allBoneSpecialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 h-10 px-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {editingId ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95"
                >
                  Update
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            ) : isCreating ? (
              <>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95"
                >
                  Save
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95"
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold">
              {activeTab === 'bone' ? 'Bone Specialties Tree' : 'Pathology Categories'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTab === 'bone'
                ? `${boneSpecialties.length} root categories`
                : `${pathologyCategories.length} categories`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === 'bone' ? (
            boneSpecialties.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No bone specialties found. Create one above.
              </div>
            ) : (
              <div>{renderBoneTree(filteredBoneSpecialties)}</div>
            )
          ) : pathologyCategories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No pathology categories found. Create one above.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">Code</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Bone Specialty</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pathologyCategories.map((item) => (
                  <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/30 ${!item.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{item.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.boneSpecialtyName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.displayOrder}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {item.isActive ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
