'use client';

import { useId } from 'react';

/**
 * Inline SVG illustrations — avoids broken /images/* requests when basePath,
 * reverse proxies, or static export mis-resolve public URLs.
 */
export function ClassDetailHeroSvg({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const gidBg = `cdh-bg-${id}`;
  const gidGlow = `cdh-glow-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 600"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={gidBg} x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
          <stop stopColor="#061a30" />
          <stop offset="0.45" stopColor="#0d3a6b" />
          <stop offset="1" stopColor="#1a5f9e" />
        </linearGradient>
        <linearGradient id={gidGlow} x1="400" y1="100" x2="400" y2="520" gradientUnits="userSpaceOnUse">
          <stop stopColor="#97f2ef" stopOpacity="0.25" />
          <stop offset="1" stopColor="#97f2ef" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${gidBg})`} />
      <ellipse cx="400" cy="320" rx="280" ry="200" fill={`url(#${gidGlow})`} />
      <g stroke="#7ad6d3" strokeOpacity="0.35" strokeWidth="1.2">
        <path d="M120 480 L680 120 M80 400 L720 200 M200 560 L600 80" />
      </g>
      <g stroke="#c8daff" strokeOpacity="0.2" strokeWidth="0.8">
        <line x1="0" y1="150" x2="800" y2="150" />
        <line x1="0" y1="300" x2="800" y2="300" />
        <line x1="0" y1="450" x2="800" y2="450" />
        <line x1="200" y1="0" x2="200" y2="600" />
        <line x1="400" y1="0" x2="400" y2="600" />
        <line x1="600" y1="0" x2="600" y2="600" />
      </g>
      <path
        d="M280 380 Q400 220 520 380 Q400 440 280 380"
        stroke="#94efec"
        strokeWidth="2.5"
        strokeOpacity="0.55"
        fill="none"
      />
      <path
        d="M340 360 L400 300 L460 360"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.35"
        fill="none"
      />
      <text
        x="48"
        y="540"
        fill="#ffffff"
        fillOpacity="0.22"
        style={{ fontFamily: 'system-ui, sans-serif' }}
        fontSize="13"
        fontWeight="600"
        letterSpacing="0.2em"
      >
        BONEVISQA · CLINICAL MODULE
      </text>
    </svg>
  );
}

export function ClassDetailSpotlightSvg({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const gidBg = `cds-bg-${id}`;
  const gidRad = `cds-rad-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 400"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={gidBg} x1="0" y1="0" x2="640" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2f3d" />
          <stop offset="0.5" stopColor="#2d4a5c" />
          <stop offset="1" stopColor="#0f2433" />
        </linearGradient>
        <radialGradient
          id={gidRad}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(480 80) rotate(120) scale(420 360)"
        >
          <stop stopColor="#97f2ef" stopOpacity="0.35" />
          <stop offset="1" stopColor="#97f2ef" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="400" fill={`url(#${gidBg})`} />
      <rect width="640" height="400" fill={`url(#${gidRad})`} />
      <circle cx="320" cy="200" r="120" fill="none" stroke="#94efec" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="320" cy="200" r="72" fill="none" stroke="#d6e3ff" strokeOpacity="0.2" strokeWidth="1" />
      <path
        d="M200 280 L320 140 L440 280"
        stroke="#97f2ef"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="#ffffff" fillOpacity="0.12">
        <rect x="56" y="56" width="8" height="8" rx="2" />
        <rect x="576" y="320" width="8" height="8" rx="2" />
        <rect x="520" y="72" width="6" height="6" rx="1.5" />
      </g>
      <text
        x="40"
        y="368"
        fill="#ffffff"
        fillOpacity="0.2"
        style={{ fontFamily: 'system-ui, sans-serif' }}
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.15em"
      >
        MODULE VISUAL
      </text>
    </svg>
  );
}

export function ClassDetailCover({
  variant,
  className,
  overlay = true,
}: {
  variant: 'hero' | 'spotlight';
  className?: string;
  overlay?: boolean;
}) {
  const Svg = variant === 'hero' ? ClassDetailHeroSvg : ClassDetailSpotlightSvg;
  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden bg-[#0d2137] ${className ?? ''}`}>
      <Svg className="absolute inset-0 h-full w-full" />
      {overlay ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#061a30]/90 via-transparent to-[#061a30]/20"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
