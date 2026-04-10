import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép Google Identity Services / popup OAuth giao tiếp qua postMessage (tránh cảnh báo COOP trên dev)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/auth/sign-in", permanent: false },
      { source: "/register", destination: "/auth/sign-up", permanent: false },
      { source: "/forgot-password", destination: "/auth/forgot-password", permanent: false },
      { source: "/reset-password", destination: "/auth/reset-password", permanent: false },
    ];
  },
};

export default nextConfig;
