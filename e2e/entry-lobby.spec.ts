import { test, expect } from '@playwright/test';

test.describe('입장 및 로비 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 localStorage 초기화
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('인증되지 않은 경우 입장 페이지로 리다이렉트되어야 함', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/entry');
    expect(page.url()).toContain('/entry');
  });

  test('닉네임이 비어있을 때 검증 에러를 표시해야 함', async ({ page }) => {
    await page.goto('/entry');

    // 닉네임 입력 없이 게임 시작 버튼 클릭
    await page.getByRole('button', { name: '게임 시작' }).click();

    // 에러 토스트 확인
    await expect(page.getByText('닉네임을 입력해주세요')).toBeVisible();
  });

  test('닉네임이 10자를 초과할 때 검증 에러를 표시해야 함', async ({ page }) => {
    await page.goto('/entry');

    // 10자보다 긴 닉네임 입력
    await page.getByPlaceholder('최대 10자').fill('ThisIsAVeryLongNickname');
    await page.getByRole('button', { name: '게임 시작' }).click();

    // 에러 토스트 확인
    await expect(page.getByText('닉네임은 최대 10자까지 가능합니다')).toBeVisible();
  });

  test('유효한 닉네임으로 회원가입에 성공해야 함', async ({ page, context }) => {
    // API 모킹
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'test-user-id',
            nickname: 'TestUser',
            roomId: null,
          },
        }),
      });
    });

    await page.goto('/entry');

    // 닉네임 입력
    await page.getByPlaceholder('최대 10자').fill('TestUser');

    // 게임 시작 버튼 클릭
    await page.getByRole('button', { name: '게임 시작' }).click();

    // 성공 토스트 확인
    await expect(page.getByText('환영합니다, TestUser님!')).toBeVisible();

    // 로비 페이지로 이동 확인
    await page.waitForURL('**/lobby');
    expect(page.url()).toContain('/lobby');
  });

  test('엔터 키로 닉네임을 제출할 수 있어야 함', async ({ page }) => {
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'test-user-id',
            nickname: 'TestUser',
            roomId: null,
          },
        }),
      });
    });

    await page.goto('/entry');

    // 닉네임 입력 후 Enter 키 입력
    const input = page.getByPlaceholder('최대 10자');
    await input.fill('TestUser');
    await input.press('Enter');

    // 로비 페이지로 이동 확인
    await page.waitForURL('**/lobby');
    expect(page.url()).toContain('/lobby');
  });

  test('로비에서 방 목록을 표시해야 함', async ({ page }) => {
    // API 모킹 - rooms list
    await page.route('**/api/rooms/lists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            list: [
              {
                id: 'room-1',
                name: 'Test Room 1',
                currentPlayers: 3,
                maxPlayers: 8,
                status: 'AVAILABLE',
              },
              {
                id: 'room-2',
                name: 'Test Room 2',
                currentPlayers: 8,
                maxPlayers: 8,
                status: 'FULL',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/auth/check-current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'test-user-id',
            nickname: 'TestUser',
            roomId: null,
          },
        }),
      });
    });

    // localStorage에 세션 정보 설정
    await page.goto('/lobby');
    await page.evaluate(() => {
      localStorage.setItem('mafia_session_id', 'test-user-id');
      localStorage.setItem('mafia_nickname', 'TestUser');
    });
    await page.reload();

    // 방 목록 표시 확인
    await expect(page.getByText('Test Room 1')).toBeVisible();
    await expect(page.getByText('Test Room 2')).toBeVisible();
    await expect(page.getByText('3/8명')).toBeVisible();
    await expect(page.getByText('8/8명')).toBeVisible();
  });

  test('방 만들기 버튼 클릭 시 모달을 표시해야 함', async ({ page }) => {
    await page.route('**/api/auth/check-current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'test-user-id',
            nickname: 'TestUser',
            roomId: null,
          },
        }),
      });
    });

    await page.route('**/api/rooms/lists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { list: [] },
        }),
      });
    });

    await page.goto('/lobby');
    await page.evaluate(() => {
      localStorage.setItem('mafia_session_id', 'test-user-id');
      localStorage.setItem('mafia_nickname', 'TestUser');
    });
    await page.reload();

    // 방 만들기 버튼 클릭
    await page.getByRole('button', { name: '방 만들기' }).click();

    // 모달 표시 확인
    await expect(page.getByRole('heading', { name: '방 만들기' })).toBeVisible();
    await expect(page.getByPlaceholder('방 제목 입력')).toBeVisible();
  });

  test('방 제목 없이 방을 생성할 때 에러를 표시해야 함', async ({ page }) => {
    await page.route('**/api/auth/check-current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'test-user-id',
            nickname: 'TestUser',
            roomId: null,
          },
        }),
      });
    });

    await page.route('**/api/rooms/lists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { list: [] },
        }),
      });
    });

    await page.goto('/lobby');
    await page.evaluate(() => {
      localStorage.setItem('mafia_session_id', 'test-user-id');
      localStorage.setItem('mafia_nickname', 'TestUser');
    });
    await page.reload();

    // 방 만들기 버튼 클릭
    await page.getByRole('button', { name: '방 만들기' }).click();

    // 빈 제목으로 생성 버튼 클릭
    await page.getByRole('button', { name: '생성' }).click();

    // 에러 토스트 확인
    await expect(page.getByText('방 제목을 입력해주세요')).toBeVisible();
  });
});
