import { Page, BrowserContext } from '@playwright/test';

/**
 * 테스트 플레이어 정보
 */
export interface TestPlayer {
  page: Page;
  userId: string;
  nickname: string;
  role?: 'MAFIA' | 'DOCTOR' | 'POLICE' | 'CITIZEN';
  isAlive?: boolean;
}

/**
 * 여러 플레이어 생성 헬퍼
 */
export async function createPlayers(
  context: BrowserContext,
  count: number = 8
): Promise<TestPlayer[]> {
  const players: TestPlayer[] = [];

  for (let i = 0; i < count; i++) {
    const page = await context.newPage();
    players.push({
      page,
      userId: `test-user-${i + 1}`,
      nickname: `Player${i + 1}`,
      isAlive: true,
    });
  }

  return players;
}

/**
 * 플레이어 회원가입 헬퍼
 */
export async function signupPlayer(player: TestPlayer): Promise<void> {
  const { page, userId, nickname } = player;

  // API 모킹
  await page.route('**/api/auth/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          userId,
          nickname,
          roomId: null,
        },
      }),
    });
  });

  await page.goto('/entry');
  await page.getByPlaceholder('최대 10자').fill(nickname);
  await page.getByRole('button', { name: '게임 시작' }).click();
  await page.waitForURL('**/lobby');
}

/**
 * 방 생성 헬퍼 (첫 번째 플레이어가 호스트)
 */
export async function createRoom(
  player: TestPlayer,
  roomName: string = '테스트 게임방'
): Promise<string> {
  const roomId = `room-${Date.now()}`;

  await player.page.route('**/api/rooms', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: roomId,
            name: roomName,
          },
        }),
      });
    }
  });

  await player.page.route('**/api/rooms/lists', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { list: [] },
      }),
    });
  });

  await player.page.goto('/lobby');
  await player.page.evaluate((userId) => {
    localStorage.setItem('mafia_session_id', userId);
  }, player.userId);
  await player.page.reload();

  await player.page.getByRole('button', { name: '방 만들기' }).click();
  await player.page.getByPlaceholder('방 제목 입력').fill(roomName);
  await player.page.getByRole('button', { name: '생성' }).click();
  await player.page.waitForURL(`**/rooms/${roomId}`);

  return roomId;
}

/**
 * 방 참여 헬퍼
 */
export async function joinRoom(player: TestPlayer, roomId: string): Promise<void> {
  await player.page.route(`**/api/rooms/${roomId}/join`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { roomId },
      }),
    });
  });

  await player.page.goto(`/rooms/${roomId}`);
}

/**
 * 모든 플레이어에게 방 상세 정보 API 모킹
 */
export async function mockRoomDetail(
  players: TestPlayer[],
  roomId: string,
  roomName: string = '테스트 게임방'
): Promise<void> {
  const members = players.map((p, index) => ({
    userId: p.userId,
    nickname: p.nickname,
    role: index === 0 ? 'HOST' : 'MEMBER',
  }));

  for (const player of players) {
    await player.page.route(`**/api/rooms/${roomId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: roomId,
            name: roomName,
            currentPlayers: players.length,
            maxPlayers: 8,
            members,
          },
        }),
      });
    });
  }
}

/**
 * 게임 시작 API 모킹
 */
export async function mockGameStart(
  hostPlayer: TestPlayer,
  roomId: string,
  gameId: string
): Promise<void> {
  await hostPlayer.page.route(`**/api/rooms/${roomId}/games/start`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          gameId,
          currentPhase: 'NIGHT',
          dayCount: 1,
        },
      }),
    });
  });
}

/**
 * 게임 상태 API 모킹
 */
export async function mockGameState(
  players: TestPlayer[],
  gameId: string,
  phase: string = 'NIGHT',
  dayCount: number = 1
): Promise<void> {
  for (const player of players) {
    await player.page.route(`**/api/games/${gameId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            gameId,
            currentPhase: phase,
            dayCount,
            phaseEndTime: Date.now() + 60000, // 60초 후
          },
        }),
      });
    });
  }
}

/**
 * 직업 배정 헬퍼 (2명 마피아, 1명 의사, 1명 경찰, 나머지 시민)
 */
export function assignRoles(players: TestPlayer[]): void {
  players[0].role = 'MAFIA';
  players[1].role = 'MAFIA';
  players[2].role = 'DOCTOR';
  players[3].role = 'POLICE';
  for (let i = 4; i < players.length; i++) {
    players[i].role = 'CITIZEN';
  }
}

/**
 * 내 직업 API 모킹
 */
export async function mockMyRole(player: TestPlayer, gameId: string): Promise<void> {
  await player.page.route(`**/api/games/${gameId}/my-role*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          role: player.role,
          isAlive: player.isAlive ?? true,
        },
      }),
    });
  });
}

/**
 * 게임 플레이어 목록 API 모킹
 */
export async function mockGamePlayers(
  players: TestPlayer[],
  gameId: string
): Promise<void> {
  const playerList = players.map((p) => ({
    userId: p.userId,
    username: p.nickname,
    isAlive: p.isAlive ?? true,
  }));

  for (const player of players) {
    await player.page.route(`**/api/games/${gameId}/players`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            players: playerList,
          },
        }),
      });
    });
  }
}

/**
 * 행동 등록 API 모킹
 */
export async function mockRegisterAction(player: TestPlayer, gameId: string): Promise<void> {
  await player.page.route(`**/api/games/${gameId}/actions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
      }),
    });
  });
}

/**
 * 투표 현황 API 모킹
 */
export async function mockVoteStatus(
  players: TestPlayer[],
  gameId: string,
  dayCount: number,
  votes: { targetUserId: string; count: number }[] = []
): Promise<void> {
  for (const player of players) {
    await player.page.route(`**/api/games/${gameId}/votes*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            votes: votes.map((v) => ({
              targetUserId: v.targetUserId,
              voteCount: v.count,
            })),
          },
        }),
      });
    });
  }
}

/**
 * 다음 페이즈 API 모킹
 */
export async function mockNextPhase(
  players: TestPlayer[],
  gameId: string,
  nextPhase: string,
  dayCount: number,
  lastPhaseResult?: any
): Promise<void> {
  for (const player of players) {
    await player.page.route(`**/api/games/${gameId}/next-phase`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            currentPhase: nextPhase,
            dayCount,
            lastPhaseResult,
          },
        }),
      });
    });
  }
}

/**
 * 모든 플레이어 페이지 닫기
 */
export async function closePlayers(players: TestPlayer[]): Promise<void> {
  await Promise.all(players.map((p) => p.page.close()));
}
