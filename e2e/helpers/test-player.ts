import { Page, BrowserContext } from '@playwright/test';
import { signup } from './api-client';

export interface TestPlayer {
  page: Page;
  userId: string;
  nickname: string;
  role?: string;
  isAlive: boolean;
}

/**
 * 여러 플레이어 생성 및 회원가입
 */
export async function createPlayers(context: BrowserContext, count: number): Promise<TestPlayer[]> {
  const players: TestPlayer[] = [];
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  for (let i = 0; i < count; i++) {
    const page = await context.newPage();
    // 타임스탬프와 랜덤 문자열로 닉네임 충돌 방지
    const nickname = `P${i + 1}_${timestamp}_${random}`;

    // 실제 서버에 회원가입 요청
    const result = await signup(page, nickname);

    if (!result.success || !result.data) {
      // 페이지 정리 후 에러 발생
      await page.close().catch(() => {});
      throw new Error(`Failed to signup player ${nickname}: ${result.message || 'Unknown error'}`);
    }

    players.push({
      page,
      userId: result.data.userId,
      nickname: result.data.nickname,
      isAlive: true,
    });

    // localStorage에 세션 정보 저장
    await page.goto('/');
    await page.evaluate(
      ({ userId, nickname }) => {
        localStorage.setItem('mafia_session_id', userId);
        localStorage.setItem('mafia_nickname', nickname);
      },
      { userId: result.data.userId, nickname: result.data.nickname }
    );
  }

  return players;
}

/**
 * 모든 플레이어 페이지 닫기
 */
export async function closePlayers(players: TestPlayer[]): Promise<void> {
  await Promise.all(
    players.map((p) =>
      p.page.close().catch((err) => {
        console.error(`Failed to close page for ${p.nickname}:`, err);
      })
    )
  );
}

/**
 * 플레이어가 특정 URL로 이동
 */
export async function navigateAllPlayers(players: TestPlayer[], url: string): Promise<void> {
  await Promise.all(players.map((p) => p.page.goto(url)));
}

/**
 * 플레이어 대기
 */
export async function waitForAll(players: TestPlayer[], ms: number): Promise<void> {
  await Promise.all(players.map((p) => p.page.waitForTimeout(ms)));
}
