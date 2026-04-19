import type { NextConfig } from "next";

function getSupabaseHostnameFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = getSupabaseHostnameFromEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/**',
          },
        ]
      : [],
  },
  async redirects() {
    return [
      { source: "/login", destination: "/auth/sign-in", permanent: false },
      { source: "/register", destination: "/auth/sign-up", permanent: false },
      { source: "/forgot-password", destination: "/auth/forgot-password", permanent: false },
      { source: "/reset-password", destination: "/auth/reset-password", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/auth/sign-in",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
            // value: "unsafe-none",
      //     },
      //   ],
      // },
      // {
      //   source: "/auth/sign-up",
      //   headers: [
      //     {
      //       key: "Cross-Origin-Opener-Policy",
      //       value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
