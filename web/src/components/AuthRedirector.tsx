'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthRedirector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onUnauthorized = () => {
      if (pathname?.startsWith('/auth/sign-in')) return;
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`/auth/sign-in${redirect}`);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [pathname, router]);

  return null;
}
