import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  GraduationCap,
  Hexagon,
  Quote,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          BoneVisQA
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-600 sm:flex-1">
          <Link href="#features" className="transition-colors hover:text-blue-600">
            Features
          </Link>
          <Link href="#roles" className="transition-colors hover:text-blue-600">
            Roles
          </Link>
          <Link href="#university" className="transition-colors hover:text-blue-600">
            University
          </Link>
        </nav>
        <div className="flex justify-center sm:justify-end">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:py-24 lg:gap-16">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Next-gen diagnostics
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Master Bone Diagnostics with AI-Powered{' '}
            <span className="text-blue-600">Visual Q&amp;A</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Bridge the gap between radiology and clinical evidence. Our platform leverages advanced AI
            Image Processing and RAG to provide hallucination-free, peer-reviewed medical insights.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Get Started (Student)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#university"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50/80 px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Partner with us (University)
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl shadow-slate-200/60">
            <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="relative flex aspect-[4/5] min-h-[220px] items-center justify-center bg-slate-800 sm:aspect-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                <ScanLine className="relative z-10 h-16 w-16 text-slate-400/90" strokeWidth={1.25} />
                <span className="absolute bottom-3 left-3 z-10 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                  Study preview
                </span>
              </div>
              <div className="flex flex-col justify-between bg-white p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    Clinical analysis
                  </p>
                  <p className="mt-2 text-sm font-medium leading-snug text-slate-900">
                    RAG-grounded differential aligned with institutional guidelines.
                  </p>
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Literature
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Campbell&apos;s Operative Orthopaedics — Ch. 12, pp. 412–418 (excerpt cited).
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>Diagnostic confidence</span>
                    <span className="text-blue-600">92%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-blue-600 to-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-slate-100 bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Engineered for Editorial Precision
          </h2>
          <p className="mt-3 text-slate-600">
            A unified stack for teaching, triage, and evidence-backed answers—without compromising clinical rigor.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="flex min-h-[280px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:min-h-[340px]">
            <Hexagon className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
            <div>
              <h3 className="text-xl font-bold text-slate-900">Interactive Visual Q&amp;A</h3>
              <p className="mt-3 text-slate-600">
                Draw regions of interest on real studies and receive structured reports—not generic chat
                replies—built for medical education workflows.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 shadow-sm">
            <Brain className="h-9 w-9 text-blue-700" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Hallucination-Free RAG AI</h3>
            <p className="mt-2 text-sm text-slate-600">
              Retrieval-augmented answers cite your knowledge base so learners see where every claim comes from.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 shadow-sm">
            <ShieldCheck className="h-9 w-9 text-blue-700" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Expert Workflows</h3>
            <p className="mt-2 text-sm text-slate-600">
              Escalate, review, and approve—so high-stakes outputs stay aligned with your curriculum.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <BarChart3 className="h-9 w-9 text-blue-600" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Advanced Progress Analytics</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track mastery by topic and modality with cohort-ready dashboards for lecturers.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Topic mastery', w: '78%' },
                { label: 'Quiz accuracy', w: '64%' },
                { label: 'Case exposure', w: '91%' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                    <span>{row.label}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: row.w }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    {
      title: 'Medical Students',
      icon: GraduationCap,
      bullets: [
        'Practice with structured Visual Q&A on real-style cases',
        'See citations and confidence signals for every answer',
        'Track progress across topics and difficulty levels',
      ],
      cta: 'Start Learning',
      href: '/auth/sign-up',
    },
    {
      title: 'Clinical Experts',
      icon: Stethoscope,
      bullets: [
        'Review escalations with full imaging and RAG context',
        'Approve or revise outputs for library publication',
        'Flag low-quality evidence chunks to protect learners',
      ],
      cta: 'Explore Clinical Mode',
      href: '/auth/sign-in',
    },
    {
      title: 'Lecturers',
      icon: Users,
      bullets: [
        'Triage class questions before they reach experts',
        'Assign cases and quizzes with clear deadlines',
        'Monitor cohort performance from one dashboard',
      ],
      cta: 'Request Admin Demo',
      href: '/auth/sign-in',
    },
  ] as const;

  return (
    <section id="roles" className="scroll-mt-20 border-b border-slate-100 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Precision Tools for Every Level
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          One platform—role-aware workspaces for students, faculty, and clinical partners.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <role.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{role.title}</h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm text-slate-600">
                {role.bullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={role.href}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-white py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {role.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const partners = [
    { name: "St. Mary's Med", abbr: 'SMM' },
    { name: 'OxBridge Ortho', abbr: 'OBO' },
    { name: 'Pacific Rim Radiology', abbr: 'PRR' },
    { name: 'Nordic Bone Institute', abbr: 'NBI' },
  ];

  return (
    <section id="university" className="scroll-mt-20 border-b border-slate-100 bg-blue-50/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
          Trusted by medical universities
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-6 text-center shadow-sm"
            >
              <BookOpen className="mb-2 h-8 w-8 text-blue-600/80" />
              <span className="text-xs font-bold text-slate-400">{p.abbr}</span>
              <span className="mt-1 text-xs font-medium text-slate-600">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50 md:p-10">
          <Quote className="h-10 w-10 text-blue-200" />
          <blockquote className="mt-4 text-lg font-medium leading-relaxed text-slate-800 md:text-xl">
            &ldquo;BoneVisQA has fundamentally changed how our residents connect imaging findings to
            evidence—we finally have a workflow that feels built for medicine, not generic AI.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              ES
            </div>
            <div>
              <p className="font-semibold text-slate-900">Dr. Elena Sterling</p>
              <p className="text-sm text-slate-500">Program Director, Academic Radiology</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaFooter() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ready to Elevate Diagnostic Learning?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          Join students and faculty who want structured, reviewable answers—not ungrounded chat.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 sm:w-auto"
          >
            Get Started for Free
          </Link>
          <Link
            href="mailto:support@bonevisqa.edu"
            className="inline-flex w-full max-w-xs items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Schedule a Walkthrough
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">BoneVisQA</p>
            <p className="mt-1 text-sm text-slate-500">© {new Date().getFullYear()} BoneVisQA. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <Link href="#" className="hover:text-blue-600">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-blue-600">
              Terms of Service
            </Link>
            <Link href="mailto:support@bonevisqa.edu" className="hover:text-blue-600">
              Contact Support
            </Link>
          </div>
          <div className="flex gap-4 text-slate-400">
            <span className="h-9 w-9 rounded-full border border-slate-200 bg-white" aria-hidden />
            <span className="h-9 w-9 rounded-full border border-slate-200 bg-white" aria-hidden />
            <span className="h-9 w-9 rounded-full border border-slate-200 bg-white" aria-hidden />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <RolesSection />
        <TrustSection />
        <CtaFooter />
      </main>
    </div>
  );
}
