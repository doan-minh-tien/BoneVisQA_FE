import { redirect } from 'next/navigation';

/** Single profile route is `/profile`; keep this path for bookmarks and old links. */
export default function StudentProfileRedirectPage() {
  redirect('/profile');
}
