'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const response = await authService.checkCurrent();

        if (response.success) {
          // 세션 유효 - 로비로 이동
          router.push('/lobby');
        } else {
          // 세션 무효 - entry로 이동
          router.push('/entry');
        }
      } catch (error) {
        // 에러 발생 시 entry로 이동
        router.push('/entry');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // 체크 중일 때는 빈 화면 (또는 로딩 표시)
  return null;
}
