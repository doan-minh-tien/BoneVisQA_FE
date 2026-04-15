'use client';

import { ArrowRight, Brain, HeartPulse, Microscope, Scan, Users } from 'lucide-react';
import type { StudentClassItem } from '@/lib/api/student';

const FEATURED_XRAY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDHKz8-ejuc7JMM6XWYzP8Re2yqhDPT924yJ7BeZ-bSFszTJeTVJmx2W0F545kZiMeLMqVHdZoeYj3m6vDfuFxtN2CofQP_-gQm2nh2dnZge8vkHTFDH8kFJ8mece1TVLowSYe3TUAf3lReuwBb4RGMfy7xR7e5Huk5no3kLjVCcqCrhj0EX_oMnXtOotOEwhJL53kIltypFSQXA3wuc9OX2hKjvJAuHEVRDjcyNlVBOupklYmidcHGlKaCeNdehtXukPwX33iJGQk';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const BADGE_FEATURED = {
  label: 'Clinical module',
  className: 'border border-primary/20 bg-primary/10 text-primary',
};
const BADGE_SECONDARY = {
  label: 'Diagnostic track',
  className: 'border border-warning/25 bg-warning/10 text-amber-900 dark:text-amber-200',
};

const SMALL_ICONS = [Microscope, HeartPulse, Brain] as const;

function activityPercent(cls: StudentClassItem, maxActivity: number) {
  const raw = cls.totalQuizzes + cls.totalCases;
  if (maxActivity <= 0) return 15;
  return Math.max(12, Math.min(100, Math.round((raw / maxActivity) * 100)));
}

function FeaturedCourseCard({
  cls,
  colSpan,
  onEnter,
}: {
  cls: StudentClassItem;
  colSpan: '8' | '12';
  onEnter: () => void;
}) {
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const span = colSpan === '12' ? 'md:col-span-12' : 'md:col-span-8';

  return (
    <div
      className={`group relative col-span-1 overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm transition-all hover:border-primary/25 hover:shadow-lg ${span}`}
    >
      <div className="flex h-full min-h-[20rem] flex-col md:flex-row">
        <div className="relative h-64 shrink-0 md:h-auto md:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED_XRAY_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-card md:block" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_FEATURED.className}`}
              >
                {BADGE_FEATURED.label}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{cls.semester}</span>
            </div>
            <h3 className="font-['Manrope',sans-serif] text-2xl font-bold leading-tight text-card-foreground md:text-3xl">
              {cls.className}
            </h3>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
              Quizzes, clinical cases, and announcements for this cohort — open the classroom to continue your progress.
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary"
                aria-hidden
              >
                {initialsFromName(lecturer)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-card-foreground">{lecturer}</p>
                <p className="text-xs text-muted-foreground">Course lecturer</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs font-semibold">
                {cls.totalQuizzes} quiz{cls.totalQuizzes !== 1 ? 'zes' : ''} · {cls.totalCases} case
                {cls.totalCases !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onEnter}
              className="flex items-center gap-1 text-sm font-bold text-primary transition-transform group-hover:translate-x-1"
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

function SecondaryHighlightCard({
  cls,
  maxActivity,
  onEnter,
}: {
  cls: StudentClassItem;
  maxActivity: number;
  onEnter: () => void;
}) {
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const pct = activityPercent(cls, maxActivity);

  return (
    <div className="group relative col-span-1 flex flex-col justify-between rounded-2xl border-2 border-border bg-card p-6 text-card-foreground shadow-sm transition-all hover:border-primary/25 hover:shadow-md md:col-span-4 md:p-8">
      <div className="mb-6">
        <div className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Scan className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_SECONDARY.className}`}
        >
          {BADGE_SECONDARY.label}
        </span>
        <h3 className="mt-4 font-['Manrope',sans-serif] text-2xl font-bold text-card-foreground">{cls.className}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {cls.totalCases > 0
            ? `${cls.totalCases} case${cls.totalCases !== 1 ? 's' : ''} in curriculum · ${cls.totalQuizzes} assessment${cls.totalQuizzes !== 1 ? 's' : ''}.`
            : 'Assessments and materials from your lecturer appear here after you enter the class.'}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="truncate font-medium text-foreground">{lecturer}</span>
          </span>
          <span className="shrink-0 font-bold text-foreground">{cls.semester}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>Activity index</span>
          <span>{pct}%</span>
        </div>
        <button
          type="button"
          onClick={onEnter}
          className="w-full rounded-xl border border-primary bg-primary py-2.5 text-sm font-bold text-white transition-transform hover:bg-primary-hover active:scale-95"
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
}: {
  cls: StudentClassItem;
  iconIndex: number;
  onEnter: () => void;
}) {
  const Icon = SMALL_ICONS[iconIndex % SMALL_ICONS.length];
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const creditsLabel = `${4 + (iconIndex % 4)} credits (est.)`;

  const iconWrap =
    iconIndex % 3 === 0
      ? 'bg-primary/15 text-primary'
      : iconIndex % 3 === 1
        ? 'bg-secondary-container/80 text-secondary'
        : 'bg-warning/15 text-amber-900 dark:text-amber-200';

  return (
    <div className="group col-span-1 rounded-2xl border-2 border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md md:col-span-4">
      <div className="mb-6 flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrap}`}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <span className="text-xs font-bold text-muted-foreground">{creditsLabel}</span>
      </div>
      <h4 className="mb-2 font-['Manrope',sans-serif] text-xl font-bold text-card-foreground">{cls.className}</h4>
      <p className="mb-6 text-sm text-muted-foreground">
        {cls.totalQuizzes} quiz · {cls.totalCases} case{cls.totalCases !== 1 ? 's' : ''} ·{' '}
        {cls.totalAnnouncements} announcement{cls.totalAnnouncements !== 1 ? 's' : ''}
      </p>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-primary">
          {initialsFromName(lecturer)}
        </div>
        <span className="truncate text-sm font-medium text-card-foreground">{lecturer}</span>
      </div>
      <button
        type="button"
        onClick={onEnter}
        className="w-full rounded-xl border border-border bg-background py-3 text-sm font-bold text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-white"
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
    <div className="mt-12 flex flex-wrap items-center justify-between gap-8 rounded-2xl border border-border bg-muted/50 p-6 md:mt-16">
      <div className="flex flex-wrap items-center gap-8 md:gap-10">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active classes</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-foreground">{classes.length}</p>
        </div>
        <div className="hidden h-10 w-px bg-border sm:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned quizzes</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-foreground">{totalQuizzes}</p>
        </div>
        <div className="hidden h-10 w-px bg-border sm:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Curriculum cases</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-primary">{totalCases}</p>
        </div>
        <div className="hidden h-10 w-px bg-border md:block" aria-hidden />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Announcements</p>
          <p className="font-['Manrope',sans-serif] text-2xl font-black text-foreground">{totalAnnouncements}</p>
        </div>
      </div>
      <div className="flex -space-x-3">
        {extra > 0 ? (
          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary ring-4 ring-card">
            +{extra}
          </div>
        ) : null}
        {stack.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary ring-4 ring-card"
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
}: {
  classes: StudentClassItem[];
  onEnterClass: (cls: StudentClassItem) => void;
}) {
  const maxActivity = Math.max(1, ...classes.map((c) => c.totalQuizzes + c.totalCases));
  const featured = classes[0];
  const secondary = classes[1];
  const rest = classes.slice(2);

  return (
    <div className="text-foreground">
      <div className="mb-10 sm:mb-12">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Semester core curriculum</span>
        <h1 className="mt-2 font-['Manrope',sans-serif] text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Active coursework
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {featured ? (
          <FeaturedCourseCard
            cls={featured}
            colSpan={secondary ? '8' : '12'}
            onEnter={() => onEnterClass(featured)}
          />
        ) : null}
        {secondary ? (
          <SecondaryHighlightCard
            cls={secondary}
            maxActivity={maxActivity}
            onEnter={() => onEnterClass(secondary)}
          />
        ) : null}
        {rest.map((cls, i) => (
          <SmallCourseCard
            key={cls.classId}
            cls={cls}
            iconIndex={i}
            onEnter={() => onEnterClass(cls)}
          />
        ))}
      </div>

      <CourseworkStatsTicker classes={classes} />
    </div>
  );
}
