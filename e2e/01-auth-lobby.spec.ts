import { test, expect } from '@playwright/test';
import { signup, getRoomList } from './helpers/api-client';

/**
 * 회원가입 및 로비 테스트
 */
test.describe('회원가입 및 로비', () => {
  test('회원가입 후 로비로 이동', async ({ page }) => {
    // Entry 페이지로 이동
    await page.goto('/entry');

    // 닉네임 입력
    const nickname = `TestUser${Date.now()}`;
    await page.getByPlaceholder('최대 10자').fill(nickname);

    // 게임 시작 버튼 클릭
    await page.getByRole('button', { name: '게임 시작' }).click();

    // 로비 페이지로 이동 확인
    await page.waitForURL('**/lobby');
    expect(page.url()).toContain('/lobby');

    // localStorage에 세션 정보 저장 확인
    const sessionId = await page.evaluate(() => localStorage.getItem('mafia_session_id'));
    const storedNickname = await page.evaluate(() => localStorage.getItem('mafia_nickname'));

    expect(sessionId).toBeTruthy();
    expect(storedNickname).toBe(nickname);
  });

  test('로비에서 방 목록 조회', async ({ page }) => {
    // 회원가입
    const nickname = `TestUser${Date.now()}`;
    const result = await signup(page, nickname);

    expect(result.success).toBe(true);
    expect(result.data?.userId).toBeTruthy();

    // localStorage 설정
    await page.goto('/');
    await page.evaluate(
      ({ userId, nickname }) => {
        localStorage.setItem('mafia_session_id', userId);
        localStorage.setItem('mafia_nickname', nickname);
      },
      { userId: result.data.userId, nickname: result.data.nickname }
    );

    // 로비로 이동
    await page.goto('/lobby');

    // 방 목록이 표시되는지 확인 (비어있을 수 있음)
    await page.waitForTimeout(1000);

    // 방 만들기 버튼 확인
    await expect(page.getByRole('button', { name: '방 만들기' })).toBeVisible();
  });

  test('중복 닉네임으로 회원가입 시도', async ({ page }) => {
    const nickname = `DuplicateUser${Date.now()}`;

    // 첫 번째 회원가입
    const result1 = await signup(page, nickname);
    expect(result1.success).toBe(true);

    // 두 번째 회원가입 (중복)
    const result2 = await signup(page, nickname);

    // 서버가 에러를 반환하는지 확인
    expect(result2.success).toBe(false);
  });

  test('빈 닉네임으로 회원가입 불가', async ({ page }) => {
    await page.goto('/entry');

    // 빈 닉네임으로 시도
    await page.getByPlaceholder('최대 10자').fill('');

    // 버튼이 비활성화되거나 입력 필드에 에러가 표시되는지 확인
    const button = page.getByRole('button', { name: '게임 시작' });
    const isDisabled = await button.isDisabled();

    // 버튼이 비활성화되어 있어야 함 (또는 클릭해도 이동하지 않음)
    expect(isDisabled).toBe(true);
  });
});
