'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // entry 페이지는 인증 체크 제외
      if (pathname === '/entry') {
        setIsChecking(false);
        return;
      }

      try {
        const response = await authService.checkCurrent();

        if (response.success) {
          // 세션 유효 - 현재 페이지 유지
          setIsChecking(false);
        } else {
          // 세션 무효 (401) - entry로 리다이렉트
          router.push('/entry');
        }
      } catch (error) {
        // 에러 발생 시에도 entry로 리다이렉트
        router.push('/entry');
      }
    };

    checkAuth();
  }, [pathname, router]);

  // 인증 체크 중일 때는 빈 화면 또는 로딩 표시
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
