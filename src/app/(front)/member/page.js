import { redirect } from 'next/navigation';

export default function PostPage() {
  redirect('/member/profile');
  return <></>;
}
