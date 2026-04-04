'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CreateClassDialog from '@/components/lecturer/classes/CreateClassDialog';
import {
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Search,
  Calendar,
  Loader2,
} from 'lucide-react';
import { getLecturerClasses, createClass } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import { getApiErrorMessage } from '@/lib/api/client';
import type { ClassItem } from '@/lib/api/types';

export default function LecturerClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Create class dialog
  const [showCreate, setShowCreate] = useState(false);
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
      const userId = getStoredUserId();
      const created = await createClass({
        className: newClassName.trim(),
        semester: newSemester.trim(),
        lecturerId: userId,
      });
      setClasses((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewClassName('');
      setNewSemester('');
    } catch {
      setCreateError('Failed to create class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    async function fetchClasses() {
      try {
        const userId = getStoredUserId();
        if (!userId) {
          setError('Chưa đăng nhập hoặc thiếu userId. Vui lòng đăng nhập lại.');
          return;
        }
        const data = await getLecturerClasses(userId);
        setClasses(data);
      } catch (e) {
        setError(getApiErrorMessage(e) || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  // Get unique semesters for filter
  const semesters = Array.from(new Set(classes.map((c) => c.semester))).sort();

  const filteredClasses = classes.filter((c) => {
    const matchSearch = c.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSemester = semesterFilter === 'all' || c.semester === semesterFilter;
    return matchSearch && matchSemester;
  });

  return (
    <div className="min-h-screen">
      <Header title="My Classes" subtitle="Manage and monitor all your classes" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{semesters.length}</p>
              <p className="text-sm text-muted-foreground">Semesters</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{filteredClasses.length}</p>
              <p className="text-sm text-muted-foreground">Showing</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSemesterFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                semesterFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  semesterFilter === sem
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">Create Class</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <Link
                key={cls.id}
                href={`/lecturer/classes/${cls.id}`}
                className="block bg-card rounded-xl border-2 border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                        {cls.semester}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors">
                      {cls.className}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium text-card-foreground">
                      {new Date(cls.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">No classes found</h3>
            <p className="text-sm text-muted-foreground">
              {classes.length === 0
                ? 'You have no classes yet. Create one to get started.'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Create Class Dialog */}
      {showCreate && (
        <CreateClassDialog
          onClose={() => setShowCreate(false)}
          onSuccess={(createdClass) => setClasses((prev) => [createdClass, ...prev])}
        />
      )}
    </div>
  );
}
