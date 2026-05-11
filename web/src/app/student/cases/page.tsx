import { redirect } from 'next/navigation';

/** Alias for the student case catalog (JWT-protected browse experience lives under `/student/catalog`). */
export default function StudentCasesPage() {
  redirect('/student/catalog');
}
