'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // AuthProvider에서 이미 currentRoom 체크를 하므로
    // 여기서는 로비로 리다이렉트만 수행
    router.push('/lobby');
  }, [router]);

  // 체크 중일 때는 빈 화면 (또는 로딩 표시)
  return null;
}
