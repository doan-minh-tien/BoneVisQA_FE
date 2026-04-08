'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  HeartPulse,
  HelpCircle,
  Microscope,
  Plus,
  Scan,
  UserMinus,
  Users,
} from 'lucide-react';
import type { StudentClassItem } from '@/lib/api/student';

const FEATURED_XRAY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDHKz8-ejuc7JMM6XWYzP8Re2yqhDPT924yJ7BeZ-bSFszTJeTVJmx2W0F545kZiMeLMqVHdZoeYj3m6vDfuFxtN2CofQP_-gQm2nh2dnZge8vkHTFDH8kFJ8mece1TVLowSYe3TUAf3lReuwBb4RGMfy7xR7e5Huk5no3kLjVCcqCrhj0EX_oMnXtOotOEwhJL53kIltypFSQXA3wuc9OX2hKjvJAuHEVRDjcyNlVBOupklYmidcHGlKaCeNdehtXukPwX33iJGQk';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const BADGE_FEATURED = { label: 'Clinical module', className: 'bg-[#94efec] text-[#006e6d]' };
const BADGE_DARK = { label: 'Diagnostic track', className: 'bg-[#ffdcc3] text-[#2f1500]' };

const SMALL_ICONS = [Microscope, HeartPulse, Brain] as const;

function activityPercent(cls: StudentClassItem, maxActivity: number) {
  const raw = cls.totalQuizzes + cls.totalCases;
  if (maxActivity <= 0) return 15;
  return Math.max(12, Math.min(100, Math.round((raw / maxActivity) * 100)));
}

function LeaveIconButton({
  onLeave,
  label,
  variant = 'light',
}: {
  onLeave: () => void;
  label: string;
  variant?: 'light' | 'dark';
}) {
  const cls =
    variant === 'dark'
      ? 'rounded-lg p-2 text-red-300 transition-colors hover:bg-white/10'
      : 'rounded-lg p-2 text-[#ba1a1a] transition-colors hover:bg-red-50';
  return (
    <button type="button" aria-label={label} onClick={(e) => { e.stopPropagation(); onLeave(); }} className={cls}>
      <UserMinus className="h-4 w-4" />
    </button>
  );
}

function FeaturedCourseCard({
  cls,
  colSpan,
  onEnter,
  onLeave,
}: {
  cls: StudentClassItem;
  colSpan: '8' | '12';
  onEnter: () => void;
  onLeave: () => void;
}) {
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const span = colSpan === '12' ? 'md:col-span-12' : 'md:col-span-8';

  return (
    <div
      className={`group relative col-span-1 overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl ${span}`}
    >
      <div className="flex h-full min-h-[20rem] flex-col md:flex-row">
        <div className="relative h-64 shrink-0 md:h-auto md:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED_XRAY_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-white md:block" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_FEATURED.className}`}
              >
                {BADGE_FEATURED.label}
              </span>
              <span className="text-xs font-medium text-[#424752]">{cls.semester}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-['Manrope',sans-serif] text-2xl font-bold leading-tight text-[#191c1e] md:text-3xl">
                {cls.className}
              </h3>
              <LeaveIconButton onLeave={onLeave} label={`Leave ${cls.className}`} />
            </div>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-[#424752]">
              Quizzes, clinical cases, and announcements for this cohort — open the classroom to continue your progress.
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eceef0] text-xs font-bold text-[#00478d]"
                aria-hidden
              >
                {initialsFromName(lecturer)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#191c1e]">{lecturer}</p>
                <p className="text-xs text-[#424752]">Course lecturer</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#c2c6d4]/30 pt-6">
            <div className="flex items-center gap-1.5 text-[#424752]">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs font-semibold">
                {cls.totalQuizzes} quiz{cls.totalQuizzes !== 1 ? 'zes' : ''} · {cls.totalCases} case
                {cls.totalCases !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onEnter}
              className="flex items-center gap-1 text-sm font-bold text-[#00478d] transition-transform group-hover:translate-x-1"
            >
              Enter classroom
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkCourseCard({
  cls,
  maxActivity,
  onEnter,
  onLeave,
}: {
  cls: StudentClassItem;
  maxActivity: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const pct = activityPercent(cls, maxActivity);

  return (
    <div className="group relative col-span-1 flex flex-col justify-between rounded-3xl bg-[#2d3133] p-6 text-white shadow-lg md:col-span-4 md:p-8">
      <div className="mb-6">
        <div className="mb-6 flex items-start justify-between gap-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#97f2ef]">
            <Scan className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          </div>
          <LeaveIconButton variant="dark" onLeave={onLeave} label={`Leave ${cls.className}`} />
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_DARK.className}`}
        >
          {BADGE_DARK.label}
        </span>
        <h3 className="mt-4 font-['Manrope',sans-serif] text-2xl font-bold">{cls.className}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {cls.totalCases > 0
            ? `${cls.totalCases} case${cls.totalCases !== 1 ? 's' : ''} in curriculum · ${cls.totalQuizzes} assessment${cls.totalQuizzes !== 1 ? 's' : ''}.`
            : 'Assessments and materials from your lecturer appear here after you enter the class.'}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="truncate font-medium">{lecturer}</span>
          </span>
          <span className="shrink-0 font-bold">{cls.semester}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#97f2ef] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
          <span>Activity index</span>
          <span>{pct}%</span>
        </div>
        <button
          type="button"
          onClick={onEnter}
          className="w-full rounded-xl bg-[#97f2ef] py-2.5 text-sm font-bold text-[#00201f] transition-transform hover:scale-[1.02] active:scale-95"
        >
          Open class
        </button>
      </div>
    </div>
  );
}

function SmallCourseCard({
  cls,
  iconIndex,
  onEnter,
  onLeave,
}: {
  cls: StudentClassItem;
  iconIndex: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const Icon = SMALL_ICONS[iconIndex % SMALL_ICONS.length];
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const creditsLabel = `${4 + (iconIndex % 4)} credits (est.)`;

  const iconWrap =
    iconIndex % 3 === 0
      ? 'bg-[#d6e3ff] text-[#00468c]'
      : iconIndex % 3 === 1
        ? 'bg-[#94efec] text-[#006e6d]'
        : 'bg-[#ffdcc3] text-[#6e3900]';

  return (
    <div className="group col-span-1 rounded-3xl border border-[#c2c6d4]/20 bg-[#f2f4f6] p-6 transition-all hover:border-[#c2c6d4]/50 md:col-span-4">
      <div className="mb-6 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrap}`}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-[#424752]">{creditsLabel}</span>
          <LeaveIconButton onLeave={onLeave} label={`Leave ${cls.className}`} />
        </div>
      </div>
      <h4 className="mb-2 font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e]">{cls.className}</h4>
      <p className="mb-6 text-sm text-[#424752]">
        {cls.totalQuizzes} quiz · {cls.totalCases} case{cls.totalCases !== 1 ? 's' : ''} ·{' '}
        {cls.totalAnnouncements} announcement{cls.totalAnnouncements !== 1 ? 's' : ''}
      </p>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e0e3e5] text-[10px] font-bold text-[#00478d]">
          {initialsFromName(lecturer)}
        </div>
        <span className="truncate text-sm font-medium text-[#191c1e]">{lecturer}</span>
      </div>
      <button
        type="button"
        onClick={onEnter}
        className="w-full rounded-xl bg-white py-3 text-sm font-bold text-[#00478d] shadow-sm transition-colors hover:bg-[#00478d] hover:text-white"
      >
        Syllabus &amp; materials
      </button>
    </div>
  );
}

function CourseworkStatsTicker({ classes }: { classes: StudentClassItem[] }) {
  const totalQuizzes = classes.reduce((s, c) => s + c.totalQuizzes, 0);
  const totalCases = classes.reduce((s, c) => s + c.totalCases, 0);
  const totalAnnouncements = classes.reduce((s, c) => s + c.totalAnnouncements, 0);
  const lecturers = classes.map((c) => c.lecturerName?.trim()).filter(Boolean) as string[];
  const stack = lecturers.slice(0, 3);
  const extra = Math.max(0, classes.length - stack.length);

  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-[#eceef0] p-6 md:mt-16">
      <div className="flex flex-wrap items-center gap-8 md:gap-10">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#424752]">Active classes</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-[#191c1e]">{classes.length}</p>
        </div>
        <div className="hidden h-10 w-px bg-[#c2c6d4]/40 sm:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#424752]">Assigned quizzes</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-[#191c1e]">{totalQuizzes}</p>
        </div>
        <div className="hidden h-10 w-px bg-[#c2c6d4]/40 sm:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#424752]">Curriculum cases</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-[#00478d]">{totalCases}</p>
        </div>
        <div className="hidden h-10 w-px bg-[#c2c6d4]/40 md:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#424752]">Announcements</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-[#191c1e]">{totalAnnouncements}</p>
        </div>
      </div>
      <div className="flex -space-x-3">
        {extra > 0 ? (
          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#e0e3e5] text-xs font-bold text-[#00478d] ring-4 ring-[#eceef0]">
            +{extra}
          </div>
        ) : null}
        {stack.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d6e3ff] text-[10px] font-bold text-[#00468c] ring-4 ring-[#eceef0]"
            title={name}
          >
            {initialsFromName(name)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActiveCourseworkBento({
  classes,
  onEnterClass,
  onLeaveClass,
  onArchiveView,
  onEnrollNew,
}: {
  classes: StudentClassItem[];
  onEnterClass: (cls: StudentClassItem) => void;
  onLeaveClass: (cls: StudentClassItem) => void;
  onArchiveView?: () => void;
  onEnrollNew?: () => void;
}) {
  const maxActivity = Math.max(1, ...classes.map((c) => c.totalQuizzes + c.totalCases));
  const featured = classes[0];
  const secondary = classes[1];
  const rest = classes.slice(2);

  return (
    <div className="text-[#191c1e]">
      <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 md:flex-row md:items-end">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-[#424752]">Semester core curriculum</span>
          <h1 className="mt-2 font-['Manrope',sans-serif] text-3xl font-extrabold tracking-tight text-[#191c1e] sm:text-4xl">
            Active coursework
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onArchiveView}
            className="rounded-full bg-[#e6e8ea] px-6 py-2.5 text-sm font-bold text-[#00468c] transition-opacity hover:opacity-80"
          >
            Archive view
          </button>
          <button
            type="button"
            onClick={onEnrollNew}
            className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00478d]/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Enroll new
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {featured ? (
          <FeaturedCourseCard
            cls={featured}
            colSpan={secondary ? '8' : '12'}
            onEnter={() => onEnterClass(featured)}
            onLeave={() => onLeaveClass(featured)}
          />
        ) : null}
        {secondary ? (
          <DarkCourseCard
            cls={secondary}
            maxActivity={maxActivity}
            onEnter={() => onEnterClass(secondary)}
            onLeave={() => onLeaveClass(secondary)}
          />
        ) : null}
        {rest.map((cls, i) => (
          <SmallCourseCard
            key={cls.classId}
            cls={cls}
            iconIndex={i}
            onEnter={() => onEnterClass(cls)}
            onLeave={() => onLeaveClass(cls)}
          />
        ))}
      </div>

      <CourseworkStatsTicker classes={classes} />

      <Link
        href="/student/qa"
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
        aria-label="Help and Q&A"
      >
        <HelpCircle className="h-7 w-7" strokeWidth={2} />
      </Link>
    </div>
  );
}
