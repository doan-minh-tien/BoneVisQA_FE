import { redirect } from 'next/navigation';

export default function AssignmentsRootRedirectPage() {
  redirect('/student/assignments');
}
