import { redirect } from 'next/navigation';

/** Legacy route — system logs API is not exposed; keep deep links from 404ing. */
export default function AdminLogsRedirectPage() {
  redirect('/admin/dashboard');
}
