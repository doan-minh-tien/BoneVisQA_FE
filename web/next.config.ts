import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jshryhplbayoymtthqpu.supabase.co',
        pathname: '/**',
      },
    ],
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
