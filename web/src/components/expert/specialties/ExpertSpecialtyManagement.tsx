'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { expertSpecialtyApi, ExpertSpecialtyDto, ExpertSpecialtyCreateDto, ExpertSpecialtyUpdateDto } from '@/lib/api/expert-specialty';
import { http, getApiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/useAuth';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Award, 
  Clock, 
  CheckCircle2, 
  X,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Stethoscope,
  Eye,
} from 'lucide-react';

interface BoneSpecialtyOption {
  id: string;
  code: string;
  name: string;
  level: number;
  children?: BoneSpecialtyOption[];
}

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

function flattenBoneSpecialties(items: BoneSpecialtyOption[], result: BoneSpecialtyOption[] = []): BoneSpecialtyOption[] {
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      flattenBoneSpecialties(item.children, result);
    }
  }
  return result;
}

async function handleApiError(error: unknown, fallbackMessage: string): Promise<string> {
  const { toast } = await import('sonner');
  const errorMsg = getApiErrorMessage(error);
  toast.error(errorMsg || fallbackMessage);
  return errorMsg;
}

function isPermissionError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
}

const proficiencyConfig: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Beginner', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  2: { label: 'Intermediate', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  3: { label: 'Advanced', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  4: { label: 'Expert', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  5: { label: 'Master', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

function paginateLocal<T>(all: T[], pageIndex: number, pageSize: number): { items: T[]; clampedPage: number } {
  const total = all.length;
  if (total === 0) return { items: [], clampedPage: 1 };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, pageIndex), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), clampedPage };
}

export default function ExpertSpecialtyManagement({ onSuccess }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.activeRole === 'Admin';
  const [specialties, setSpecialties] = useState<ExpertSpecialtyDto[]>([]);
  /** Expert: full list from GET /my (server paging không dùng ở đây). */
  const [expertAllSpecialties, setExpertAllSpecialties] = useState<ExpertSpecialtyDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [boneSpecialties, setBoneSpecialties] = useState<BoneSpecialtyOption[]>([]);
  const [boneSpecLoaded, setBoneSpecLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewingSpecialty, setViewingSpecialty] = useState<ExpertSpecialtyDto | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<ExpertSpecialtyDto | null>(null);
  const [formData, setFormData] = useState<ExpertSpecialtyCreateDto>({
    boneSpecialtyId: '',
    proficiencyLevel: 3,
    isPrimary: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadSpecialties();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    const { items, clampedPage } = paginateLocal(expertAllSpecialties, pageIndex, pageSize);
    setSpecialties(items);
    if (clampedPage !== pageIndex) {
      setPageIndex(clampedPage);
    }
  }, [isAdmin, expertAllSpecialties, pageIndex, pageSize]);

  useEffect(() => {
    loadBoneSpecialties();
  }, []);

  useEffect(() => {
    if (editingData && boneSpecLoaded) {
      setFormData({
        boneSpecialtyId: editingData.boneSpecialtyId,
        proficiencyLevel: editingData.proficiencyLevel,
        yearsExperience: editingData.yearsExperience ?? undefined,
        certifications: editingData.certifications ?? undefined,
        isPrimary: editingData.isPrimary,
      });
    }
  }, [editingData, boneSpecLoaded]);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      if (isAdmin) {
        const data = await expertSpecialtyApi.getAllSpecialties();
        setExpertAllSpecialties([]);
        const uniqueData = data.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        );
        setSpecialties(uniqueData);
        setTotalCount(uniqueData.length);
      } else {
        const data = await expertSpecialtyApi.getMySpecialties();
        const uniqueData = data.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        );
        setExpertAllSpecialties(uniqueData);
        setTotalCount(uniqueData.length);
      }
    } catch (error) {
      console.error('Failed to load specialties:', error);
      const errorMsg = getApiErrorMessage(error);
      setLoadError(errorMsg);
      if (isPermissionError(error)) {
        setLoadError('Permission denied: You do not have permission to view this data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBoneSpecialties = async () => {
    try {
      const response = await http.get<BoneSpecialtyOption[]>('/api/common/classifications/bone-specialties/tree');
      const flattened = flattenBoneSpecialties(response.data);
      setBoneSpecialties(flattened);
      setBoneSpecLoaded(true);
    } catch (error) {
      console.error('Failed to load bone specialties:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await expertSpecialtyApi.create(formData);
      resetForm();
      loadSpecialties();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create specialty:', error);
      // Lấy message từ BE response nếu có
      const msg = getApiErrorMessage(error);
      setFormError(msg || 'Failed to create specialty. Please try again.');
      // Vẫn toast để thông báo
      const { toast } = await import('sonner');
      toast.error(msg || 'Failed to create specialty.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setFormError(null);
    
    try {
      const updateData: ExpertSpecialtyUpdateDto = {
        id: editingId,
        boneSpecialtyId: formData.boneSpecialtyId || undefined,
        proficiencyLevel: formData.proficiencyLevel,
        yearsExperience: formData.yearsExperience,
        certifications: formData.certifications,
        isPrimary: formData.isPrimary,
      };
      await expertSpecialtyApi.update(updateData);
      resetForm();
      loadSpecialties();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update specialty:', error);
      const errorMsg = await handleApiError(error, 'Failed to update specialty.');
      if (isPermissionError(error)) {
        setFormError('Permission denied.');
      }
    }
  };

  const handleViewSpecialty = async (id: string) => {
    try {
      setViewLoadingId(id);
      const data = await expertSpecialtyApi.getById(id);
      setViewingSpecialty(data);
    } catch (error) {
      console.error('Failed to load specialty details:', error);
      await handleApiError(error, 'Failed to load specialty details.');
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleEdit = (specialty: ExpertSpecialtyDto) => {
    setEditingId(specialty.id);
    setEditingData(specialty);
    setShowForm(true);
    
    if (boneSpecialties.length === 0) {
      loadBoneSpecialties();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    try {
      await expertSpecialtyApi.delete(id);
      loadSpecialties();
    } catch (error) {
      console.error('Failed to delete specialty:', error);
      await handleApiError(error, 'Failed to delete specialty.');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await expertSpecialtyApi.update({ id, isPrimary: true });
      loadSpecialties();
    } catch (error) {
      console.error('Failed to set primary:', error);
      await handleApiError(error, 'Failed to set primary specialty.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingData(null);
    setFormError(null);
    setFormData({
      boneSpecialtyId: '',
      proficiencyLevel: 3,
      isPrimary: false,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAdmin ? 'Expert Specialties' : 'My Expertise'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? `${specialties.length} specialty ${specialties.length === 1 ? 'area' : 'areas'}`
                : `${totalCount} specialty ${totalCount === 1 ? 'area' : 'areas'}`}
            </p>
          </div>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Error Banner */}
      {loadError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="flex-1 text-sm">{loadError}</p>
            <div className="flex gap-2">
              <button onClick={() => loadSpecialties()} className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">Retry</button>
              <button onClick={() => setLoadError(null)} className="px-2 py-1 text-xs border rounded">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* View detail (GET /api/expert-specialties/:id) */}
      {viewingSpecialty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-card border rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm">Specialty details</h3>
              <button
                type="button"
                onClick={() => setViewingSpecialty(null)}
                className="p-1.5 hover:bg-muted rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Bone specialty</dt>
                <dd className="font-medium">{viewingSpecialty.boneSpecialtyName || '—'}</dd>
                {viewingSpecialty.boneSpecialtyCode && (
                  <dd className="text-xs text-muted-foreground">{viewingSpecialty.boneSpecialtyCode}</dd>
                )}
              </div>
              {viewingSpecialty.pathologyCategoryName && (
                <div>
                  <dt className="text-xs text-muted-foreground">Pathology</dt>
                  <dd>{viewingSpecialty.pathologyCategoryName}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Proficiency</dt>
                <dd>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${proficiencyConfig[viewingSpecialty.proficiencyLevel]?.bgColor ?? 'bg-muted'} ${proficiencyConfig[viewingSpecialty.proficiencyLevel]?.color ?? ''}`}>
                    Lv.{viewingSpecialty.proficiencyLevel} — {proficiencyConfig[viewingSpecialty.proficiencyLevel]?.label ?? '—'}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Years experience</dt>
                  <dd>{viewingSpecialty.yearsExperience ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Certifications</dt>
                  <dd className="truncate">{viewingSpecialty.certifications || '—'}</dd>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <span className="text-xs text-muted-foreground">
                  Primary: {viewingSpecialty.isPrimary ? 'Yes' : 'No'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Status: {viewingSpecialty.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setViewingSpecialty(null)}
              className="w-full py-2.5 border rounded-lg text-sm hover:bg-muted/50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 shadow-lg">
          {/* Form Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${editingId ? 'bg-blue-500/10' : 'bg-primary/10'}`}>
                {editingId ? (
                  <Edit3 className="w-4 h-4 text-blue-600" />
                ) : (
                  <Plus className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{editingId ? 'Update Specialty' : 'Add Specialty'}</h3>
                <p className="text-xs text-muted-foreground">
                  {editingId ? 'Modify your expertise details' : 'Showcase your medical expertise'}
                </p>
              </div>
            </div>
            <button onClick={resetForm} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Permission Error */}
          {formError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            {/* Bone Specialty Select */}
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Bone Specialty *</label>
              <div className="relative">
                <select
                  required
                  value={formData.boneSpecialtyId}
                  onChange={(e) => setFormData({ ...formData, boneSpecialtyId: e.target.value })}
                  className="w-full p-2.5 pr-10 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">Choose a specialty...</option>
                  {boneSpecialties.map((bs) => (
                    <option key={bs.id} value={bs.id}>
                      {'  '.repeat(bs.level)}{bs.level > 0 ? '└ ' : ''}{bs.name} ({bs.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Proficiency Level */}
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Proficiency Level *</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, proficiencyLevel: level })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.proficiencyLevel === level
                        ? proficiencyConfig[level].bgColor
                        : 'bg-muted hover:bg-muted/70'
                    } ${proficiencyConfig[level].color}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{proficiencyConfig[formData.proficiencyLevel].label}</p>
            </div>

            {/* Years & Certifications */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Years Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience || ''}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Certifications</label>
                <input
                  type="text"
                  value={formData.certifications || ''}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value || undefined })}
                  className="w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., FRCR"
                />
              </div>
            </div>

            {/* Primary Toggle */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div
                onClick={() => setFormData({ ...formData, isPrimary: !formData.isPrimary })}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${formData.isPrimary ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.isPrimary ? 'left-4.5' : 'left-0.5'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Star className={`w-3.5 h-3.5 ${formData.isPrimary ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                  Set as Primary
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 border rounded-lg text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Specialties Grid */}
      {!isAdmin && totalCount === 0 && specialties.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl">
          <div className="p-3 rounded-xl bg-muted/50 mb-3">
            <Stethoscope className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No Specialties Yet</h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
            {isAdmin ? 'No specialties registered in the system.' : 'Add your specialties to help others find you.'}
          </p>
          {!isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              Add First Specialty
            </button>
          )}
        </div>
      ) : specialties.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl">
          <div className="p-3 rounded-xl bg-muted/50 mb-3">
            <Stethoscope className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No Specialties Yet</h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
            No specialties registered in the system.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {specialties.map((specialty) => (
            <div 
              key={specialty.id} 
              className={`group relative bg-card border rounded-xl p-4 transition-all hover:shadow-md ${
                specialty.isPrimary ? 'border-primary/30 shadow-sm shadow-primary/10' : 'hover:border-primary/20'
              }`}
            >
              {/* Primary Badge */}
              {specialty.isPrimary && (
                <div className="absolute -top-2 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    Primary
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{specialty.boneSpecialtyName || 'Unknown'}</h3>
                  {specialty.pathologyCategoryName && (
                    <p className="text-xs text-muted-foreground truncate">{specialty.pathologyCategoryName}</p>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${proficiencyConfig[specialty.proficiencyLevel]?.bgColor ?? 'bg-muted'} ${proficiencyConfig[specialty.proficiencyLevel]?.color ?? 'text-foreground'}`}>
                  Lv.{specialty.proficiencyLevel}
                </div>
              </div>

              {/* Proficiency Bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    style={{ width: `${(Math.min(5, Math.max(1, specialty.proficiencyLevel)) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                {specialty.yearsExperience && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {specialty.yearsExperience}y
                  </span>
                )}
                {specialty.certifications && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Cert
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  {specialty.isActive ? (
                    <><CheckCircle2 className="w-3 h-3 text-green-500" /> Active</>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleViewSpecialty(specialty.id)}
                  disabled={viewLoadingId === specialty.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50"
                >
                  {viewLoadingId === specialty.id ? (
                    <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin inline-block" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(specialty)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                {!specialty.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(specialty.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                  >
                    <Star className="w-3 h-3" />
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(specialty.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination — expert: client slice of GET /my */}
      {!isAdmin && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(1);
              }}
              className="p-1.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              disabled={pageIndex === 1 || loading}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm font-medium px-2">
              Page {pageIndex} of {Math.max(1, Math.ceil(totalCount / pageSize))}
            </span>
            <button
              type="button"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={pageIndex >= Math.ceil(totalCount / pageSize) || loading}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
