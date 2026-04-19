import { redirect } from 'next/navigation';

/** Legacy route — verifications UI removed from nav; redirect to dashboard. */
export default function AdminVerificationsRedirectPage() {
  redirect('/admin/dashboard');
}
