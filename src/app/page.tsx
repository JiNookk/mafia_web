import { redirect } from 'next/navigation';

export default function Home() {
  // 서버 사이드에서 즉시 리다이렉트
  redirect('/lobby');
}
