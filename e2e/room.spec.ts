import { test, expect } from '@playwright/test';

test.describe('방 생성 및 대기실', () => {
  test.beforeEach(async ({ page }) => {
    // localStorage에 세션 정보 설정
    await page.goto('/lobby');
    await page.evaluate(() => {
      localStorage.setItem('mafia_session_id', 'test-user-id');
      localStorage.setItem('mafia_nickname', 'TestUser');
    });
  });

  test('방을 성공적으로 생성해야 함', async ({ page }) => {
    // API 모킹
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

    await page.route('**/api/rooms', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-room-id',
              name: 'My Test Room',
            },
          }),
        });
      }
    });

    await page.goto('/lobby');
    await page.reload();

    // 방 만들기 버튼 클릭
    await page.getByRole('button', { name: '방 만들기' }).click();

    // 방 제목 입력
    await page.getByPlaceholder('방 제목 입력').fill('My Test Room');

    // 생성 버튼 클릭
    await page.getByRole('button', { name: '생성' }).click();

    // 성공 토스트 확인
    await expect(page.getByText('방이 생성되었습니다')).toBeVisible();

    // 대기실로 이동 확인
    await page.waitForURL('**/rooms/new-room-id');
    expect(page.url()).toContain('/rooms/new-room-id');
  });

  test('방에 성공적으로 참가해야 함', async ({ page }) => {
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
          data: {
            list: [
              {
                id: 'room-1',
                name: 'Test Room 1',
                currentPlayers: 3,
                maxPlayers: 8,
                status: 'AVAILABLE',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/rooms/room-1/join', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            roomId: 'room-1',
          },
        }),
      });
    });

    await page.goto('/lobby');
    await page.reload();

    // 방 클릭하여 참가
    await page.getByText('Test Room 1').click();

    // 성공 토스트 확인
    await expect(page.getByText('방에 참여했습니다')).toBeVisible();

    // 대기실로 이동 확인
    await page.waitForURL('**/rooms/room-1');
    expect(page.url()).toContain('/rooms/room-1');
  });

  test('가득 찬 방에 참가 시 에러를 표시해야 함', async ({ page }) => {
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
          data: {
            list: [
              {
                id: 'room-1',
                name: 'Full Room',
                currentPlayers: 8,
                maxPlayers: 8,
                status: 'FULL',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/rooms/room-1/join', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '방이 가득 찼습니다',
          errorCode: 'ROOM_FULL',
        }),
      });
    });

    await page.goto('/lobby');
    await page.reload();

    // 가득 찬 방 클릭
    await page.getByText('Full Room').click();

    // 에러 토스트 확인
    await expect(page.getByText('방이 가득 찼습니다')).toBeVisible();
  });

  test('대기실에 플레이어 목록을 표시해야 함', async ({ page }) => {
    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 3,
            maxPlayers: 8,
            members: [
              {
                userId: 'user-1',
                nickname: 'Player1',
                role: 'HOST',
              },
              {
                userId: 'user-2',
                nickname: 'Player2',
                role: 'MEMBER',
              },
              {
                userId: 'test-user-id',
                nickname: 'TestUser',
                role: 'MEMBER',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/rooms/room-1');

    // 방 정보 표시 확인
    await expect(page.getByText('Test Room (3/8)')).toBeVisible();

    // 플레이어 표시 확인
    await expect(page.getByText('Player1')).toBeVisible();
    await expect(page.getByText('Player2')).toBeVisible();
    await expect(page.getByText('TestUser')).toBeVisible();

    // 호스트 표시 확인
    await expect(page.getByText('👑')).toBeVisible();

    // 빈 슬롯 표시 확인 (5개)
    const emptySlots = await page.getByText('대기중...').count();
    expect(emptySlots).toBe(5);
  });

  test('호스트에게만 게임 시작 버튼을 표시해야 함', async ({ page }) => {
    // 호스트로 접속
    await page.evaluate(() => {
      localStorage.setItem('mafia_session_id', 'host-user-id');
      localStorage.setItem('mafia_nickname', 'HostUser');
    });

    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 1,
            maxPlayers: 8,
            members: [
              {
                userId: 'host-user-id',
                nickname: 'HostUser',
                role: 'HOST',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/rooms/room-1');

    // 게임 시작 버튼 확인
    await expect(page.getByRole('button', { name: '게임 시작' })).toBeVisible();
  });

  test('호스트가 아닌 경우 게임 시작 버튼을 표시하지 않아야 함', async ({ page }) => {
    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 2,
            maxPlayers: 8,
            members: [
              {
                userId: 'host-user-id',
                nickname: 'HostUser',
                role: 'HOST',
              },
              {
                userId: 'test-user-id',
                nickname: 'TestUser',
                role: 'MEMBER',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/rooms/room-1');

    // 게임 시작 버튼이 없어야 함
    await expect(page.getByRole('button', { name: '게임 시작' })).not.toBeVisible();
  });

  test('채팅 메시지를 입력하고 표시할 수 있어야 함', async ({ page }) => {
    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 1,
            maxPlayers: 8,
            members: [
              {
                userId: 'test-user-id',
                nickname: 'TestUser',
                role: 'HOST',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/rooms/room-1');

    // 채팅 입력창 확인
    const chatInput = page.getByPlaceholder('메시지를 입력하세요...');
    await expect(chatInput).toBeVisible();

    // 채팅 메시지 입력 (실제 웹소켓 연결 없이 UI만 테스트)
    await chatInput.fill('Hello everyone!');
    await expect(chatInput).toHaveValue('Hello everyone!');
  });

  test('방을 성공적으로 나갈 수 있어야 함', async ({ page }) => {
    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 1,
            maxPlayers: 8,
            members: [
              {
                userId: 'test-user-id',
                nickname: 'TestUser',
                role: 'HOST',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/rooms/room-1/leave', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
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

    await page.goto('/rooms/room-1');

    // 뒤로가기 버튼 클릭
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();

    // 성공 토스트 확인
    await expect(page.getByText('방을 나갔습니다')).toBeVisible();

    // 로비로 이동 확인
    await page.waitForURL('**/lobby');
    expect(page.url()).toContain('/lobby');
  });

  test('엔터 키로 채팅 메시지를 전송할 수 있어야 함', async ({ page }) => {
    await page.route('**/api/rooms/room-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'room-1',
            name: 'Test Room',
            currentPlayers: 1,
            maxPlayers: 8,
            members: [
              {
                userId: 'test-user-id',
                nickname: 'TestUser',
                role: 'HOST',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/rooms/room-1');

    // 채팅 입력 후 Enter 키 입력
    const chatInput = page.getByPlaceholder('메시지를 입력하세요...');
    await chatInput.fill('Test message');
    await chatInput.press('Enter');

    // 입력창이 비워졌는지 확인 (메시지가 전송되었음을 의미)
    // 실제 웹소켓 없이는 전송 확인이 어렵지만, 입력창 초기화는 확인 가능
    await expect(chatInput).toHaveValue('');
  });
});
