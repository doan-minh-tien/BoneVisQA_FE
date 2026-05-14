'use client';

import { useState, useEffect, useMemo } from 'react';
import { expertSpecialtyApi, ExpertSpecialtyDto } from '@/lib/api/expert-specialty';
import { http, getApiErrorMessage } from '@/lib/api/client';
import {
  Search,
  Filter,
  Star,
  Award,
  Clock,
  CheckCircle2,
  X,
  ChevronDown,
  Sparkles,
  BadgeCheck,
  Eye,
  Download,
  User,
  Stethoscope,
  Users,
  AlertTriangle,
  RefreshCw,
  GraduationCap,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface BoneSpecialtyOption {
  id: string;
  code: string;
  name: string;
  level: number;
  children?: BoneSpecialtyOption[];
}

interface ExpertInfo {
  id: string;
  name: string;
  email: string;
}

const proficiencyConfig: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Beginner', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  2: { label: 'Intermediate', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  3: { label: 'Advanced', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  4: { label: 'Expert', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  5: { label: 'Master', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

function flattenBoneSpecialties(items: BoneSpecialtyOption[], result: BoneSpecialtyOption[] = []): BoneSpecialtyOption[] {
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      flattenBoneSpecialties(item.children, result);
    }
  }
  return result;
}

export default function AdminSpecialtyManagement() {
  const [specialties, setSpecialties] = useState<ExpertSpecialtyDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [boneSpecialties, setBoneSpecialties] = useState<BoneSpecialtyOption[]>([]);
  const [boneSpecLoaded, setBoneSpecLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBoneSpecialty, setFilterBoneSpecialty] = useState('');
  const [filterExpert, setFilterExpert] = useState('');
  const [filterProficiency, setFilterProficiency] = useState<number | ''>('');
  const [showOnlyPrimary, setShowOnlyPrimary] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedSpecialty, setSelectedSpecialty] = useState<ExpertSpecialtyDto | null>(null);

  useEffect(() => {
    loadSpecialties();
  }, [pageIndex, pageSize]);

  useEffect(() => {
    loadBoneSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await expertSpecialtyApi.getAllSpecialtiesPaged(pageIndex, pageSize);
      setSpecialties(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to load specialties:', error);
      const errorMsg = getApiErrorMessage(error);
      setLoadError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSpecialty = async (id: string) => {
    try {
      setViewingId(id);
      const data = await expertSpecialtyApi.getById(id);
      setSelectedSpecialty(data);
    } catch (error) {
      console.error('Failed to load specialty details:', error);
      alert('Failed to load specialty details.');
    } finally {
      setViewingId(null);
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

  const filteredSpecialties = useMemo(() => {
    return specialties.filter((spec) => {
      const matchesSearch =
        !searchTerm ||
        spec.expertName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.expertEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.boneSpecialtyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.boneSpecialtyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.pathologyCategoryName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBoneSpecialty = !filterBoneSpecialty || spec.boneSpecialtyId === filterBoneSpecialty;
      const matchesExpert = !filterExpert || spec.expertId === filterExpert;
      const matchesProficiency = !filterProficiency || spec.proficiencyLevel === filterProficiency;
      const matchesPrimary = !showOnlyPrimary || spec.isPrimary;

      return matchesSearch && matchesBoneSpecialty && matchesExpert && matchesProficiency && matchesPrimary;
    });
  }, [specialties, searchTerm, filterBoneSpecialty, filterExpert, filterProficiency, showOnlyPrimary]);

  const uniqueExperts = useMemo(() => {
    const expertMap = new Map<string, ExpertInfo>();
    specialties.forEach((spec) => {
      if (spec.expertId && spec.expertName) {
        expertMap.set(spec.expertId, {
          id: spec.expertId,
          name: spec.expertName,
          email: spec.expertEmail || '',
        });
      }
    });
    return Array.from(expertMap.values());
  }, [specialties]);

  const stats = useMemo(() => {
    return {
      total: totalCount,
      experts: uniqueExperts.length,
      primary: specialties.filter((s) => s.isPrimary).length,
      avgProficiency:
        specialties.length > 0
          ? (specialties.reduce((sum, s) => sum + s.proficiencyLevel, 0) / specialties.length).toFixed(1)
          : '0',
    };
  }, [specialties, uniqueExperts, totalCount]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBoneSpecialty('');
    setFilterExpert('');
    setFilterProficiency('');
    setShowOnlyPrimary(false);
  };

  const hasActiveFilters = searchTerm || filterBoneSpecialty || filterExpert || filterProficiency || showOnlyPrimary;

  const exportToCSV = () => {
    const headers = ['Expert Name', 'Expert Email', 'Bone Specialty', 'Code', 'Proficiency', 'Primary', 'Years Experience', 'Certifications'];
    const rows = filteredSpecialties.map((spec) => [
      spec.expertName || '',
      spec.expertEmail || '',
      spec.boneSpecialtyName || '',
      spec.boneSpecialtyCode || '',
      proficiencyConfig[spec.proficiencyLevel]?.label || '',
      spec.isPrimary ? 'Yes' : 'No',
      spec.yearsExperience || '',
      spec.certifications || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expert-specialties-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-6 text-muted-foreground animate-pulse">Loading expert specialties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Expert Specialties</h2>
            <p className="text-sm text-muted-foreground">Manage expert medical specialties</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Error Banner */}
      {loadError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="flex-1 text-sm">{loadError}</p>
            <div className="flex gap-2">
              <button onClick={() => loadSpecialties()} className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-lg">Retry</button>
              <button onClick={() => setLoadError(null)} className="px-3 py-1.5 text-xs border border-border rounded-lg">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Specialties</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.experts}</p>
              <p className="text-xs text-muted-foreground">Experts</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.primary}</p>
              <p className="text-xs text-muted-foreground">Primary</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.avgProficiency}</p>
              <p className="text-xs text-muted-foreground">Avg Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search experts, specialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
              hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {[searchTerm, filterBoneSpecialty, filterExpert, filterProficiency, showOnlyPrimary].filter(Boolean).length}
              </span>
            )}
          </button>
          <div className="inline-flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
            >
              <BadgeCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-card border rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Bone Specialty</label>
                <div className="relative">
                  <select
                    value={filterBoneSpecialty}
                    onChange={(e) => setFilterBoneSpecialty(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">All Specialties</option>
                    {boneSpecialties.map((bs) => (
                      <option key={bs.id} value={bs.id}>
                        {'  '.repeat(bs.level)}{bs.level > 0 ? '└ ' : ''}{bs.name} ({bs.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Expert</label>
                <div className="relative">
                  <select
                    value={filterExpert}
                    onChange={(e) => setFilterExpert(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">All Experts</option>
                    {uniqueExperts.map((expert) => (
                      <option key={expert.id} value={expert.id}>
                        {expert.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Proficiency</label>
                <div className="relative">
                  <select
                    value={filterProficiency}
                    onChange={(e) => setFilterProficiency(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">All Levels</option>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        Level {level} - {proficiencyConfig[level].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setShowOnlyPrimary(!showOnlyPrimary)}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                    showOnlyPrimary ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                      showOnlyPrimary ? 'left-5' : 'left-1'
                    }`}
                  />
                </div>
                <span className="text-sm">Primary only</span>
              </label>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground">
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredSpecialties.length}</span> (filtered) of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> total specialties
        </p>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSpecialties.map((specialty) => (
            <div
              key={specialty.id}
              className={`group relative bg-card border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                specialty.isPrimary ? 'border-primary/30 shadow-sm shadow-primary/10' : 'hover:border-primary/20'
              }`}
              onClick={() => handleViewSpecialty(specialty.id)}
            >
              {specialty.isPrimary && (
                <div className="absolute -top-2 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    Primary
                  </span>
                </div>
              )}

              {/* Expert Info */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{specialty.expertName || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{specialty.expertEmail}</p>
                </div>
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight truncate">{specialty.boneSpecialtyName || 'Unknown'}</p>
                    {specialty.boneSpecialtyCode && <p className="text-xs text-muted-foreground">{specialty.boneSpecialtyCode}</p>}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${proficiencyConfig[specialty.proficiencyLevel].bgColor} ${proficiencyConfig[specialty.proficiencyLevel].color}`}>
                    Lv.{specialty.proficiencyLevel}
                  </div>
                </div>

                {specialty.pathologyCategoryName && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md truncate">{specialty.pathologyCategoryName}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                  {specialty.yearsExperience && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {specialty.yearsExperience}y
                    </span>
                  )}
                  {specialty.certifications && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Award className="w-3 h-3" />
                      Cert
                    </span>
                  )}
                  <span className="ml-auto">
                    {specialty.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className="w-4 h-4 inline-block rounded-full bg-muted" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expert</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Specialty</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Experience</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Primary</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpecialties.map((specialty, idx) => (
                  <tr
                    key={specialty.id}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'
                    }`}
                    onClick={() => handleViewSpecialty(specialty.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{specialty.expertName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{specialty.expertEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{specialty.boneSpecialtyName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{specialty.boneSpecialtyCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${proficiencyConfig[specialty.proficiencyLevel].bgColor} ${proficiencyConfig[specialty.proficiencyLevel].color}`}>
                        Lv.{specialty.proficiencyLevel} {proficiencyConfig[specialty.proficiencyLevel].label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {specialty.yearsExperience ? `${specialty.yearsExperience} years` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {specialty.isPrimary ? (
                        <Star className="w-4 h-4 text-amber-500 mx-auto fill-amber-500" />
                      ) : (
                        <span className="w-4 h-4 inline-block rounded-full bg-muted mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {specialty.isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="w-2 h-2 inline-block rounded-full bg-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSpecialty(specialty.id);
                        }}
                        disabled={viewingId === specialty.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {viewingId === specialty.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
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
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
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
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={pageIndex >= Math.ceil(totalCount / pageSize) || loading}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSpecialties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl">
          <div className="p-4 rounded-xl bg-muted/30 mb-3">
            <Stethoscope className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold mb-1">No Specialties Found</h3>
          <p className="text-sm text-muted-foreground text-center">
            {hasActiveFilters ? 'No results match your filters.' : 'No expert specialties registered yet.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSpecialty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSpecialty(null)}>
          <div
            className="bg-card border rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedSpecialty.isPrimary ? 'bg-primary/10' : 'bg-muted'}`}>
                  {selectedSpecialty.isPrimary ? (
                    <Star className="w-5 h-5 text-primary fill-primary" />
                  ) : (
                    <Stethoscope className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">Specialty Details</h3>
                  {selectedSpecialty.isPrimary && <span className="text-xs text-primary">Primary Specialty</span>}
                </div>
              </div>
              <button onClick={() => setSelectedSpecialty(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Expert */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedSpecialty.expertName || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{selectedSpecialty.expertEmail}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Bone Specialty</p>
                  <p className="font-medium text-sm">{selectedSpecialty.boneSpecialtyName || 'Unknown'}</p>
                  {selectedSpecialty.boneSpecialtyCode && <p className="text-xs text-muted-foreground">{selectedSpecialty.boneSpecialtyCode}</p>}
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Proficiency</p>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${proficiencyConfig[selectedSpecialty.proficiencyLevel].bgColor} ${proficiencyConfig[selectedSpecialty.proficiencyLevel].color}`}>
                    Level {selectedSpecialty.proficiencyLevel} - {proficiencyConfig[selectedSpecialty.proficiencyLevel].label}
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Experience</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedSpecialty.yearsExperience ? `${selectedSpecialty.yearsExperience} years` : 'Not set'}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    {selectedSpecialty.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Active
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                        Inactive
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Pathology */}
              {selectedSpecialty.pathologyCategoryName && (
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Pathology Category</p>
                  <p className="font-medium text-sm">{selectedSpecialty.pathologyCategoryName}</p>
                </div>
              )}

              {/* Certifications */}
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Certifications</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {selectedSpecialty.certifications || 'None'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t">
              <button
                onClick={() => setSelectedSpecialty(null)}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
