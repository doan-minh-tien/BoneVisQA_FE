'use client';

import { useRouter } from 'next/navigation';

export function useLogout() {
  const router = useRouter();

  return function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    localStorage.removeItem('activeRole');
    router.push('/login');
  };
}
