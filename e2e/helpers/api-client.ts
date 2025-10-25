import { Page } from '@playwright/test';

// 환경 변수에서 API URL 가져오기 (기본값: localhost:8080)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * API 응답 검증 헬퍼
 */
function validateApiResponse<T>(response: ApiResponse<T>, context: string): asserts response is ApiResponse<T> & { data: T } {
  if (!response.success) {
    throw new Error(`API call failed at ${context}: ${response.message || 'Unknown error'}`);
  }
  if (!response.data) {
    throw new Error(`API call succeeded but no data returned at ${context}`);
  }
}

/**
 * 회원가입
 */
export async function signup(page: Page, nickname: string) {
  try {
    const response = await page.request.post(`${API_BASE_URL}/auth/signup`, {
      data: { nickname },
      timeout: 10000,
    });

    if (!response.ok()) {
      throw new Error(`Signup failed with status ${response.status()}`);
    }

    const result = await response.json() as ApiResponse<{ userId: string; nickname: string }>;
    validateApiResponse(result, 'signup');
    return result;
  } catch (error) {
    throw new Error(`Signup request failed for "${nickname}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 방 생성
 */
export async function createRoom(page: Page, userId: string, name: string) {
  try {
    const response = await page.request.post(`${API_BASE_URL}/rooms`, {
      data: { userId, name },
      timeout: 10000,
    });

    if (!response.ok()) {
      throw new Error(`Create room failed with status ${response.status()}`);
    }

    const result = await response.json() as ApiResponse<{ id: string; name: string }>;
    validateApiResponse(result, 'createRoom');
    return result;
  } catch (error) {
    throw new Error(`Create room request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 방 목록 조회
 */
export async function getRoomList(page: Page) {
  const response = await page.request.get(`${API_BASE_URL}/rooms`);
  return response.json() as Promise<ApiResponse<{ list: any[] }>>;
}

/**
 * 방 상세 조회
 */
export async function getRoomDetail(page: Page, roomId: string) {
  const response = await page.request.get(`${API_BASE_URL}/rooms/${roomId}`);
  return response.json();
}

/**
 * 방 참여
 */
export async function joinRoom(page: Page, roomId: string, userId: string) {
  const response = await page.request.post(`${API_BASE_URL}/rooms/${roomId}/join`, {
    data: { userId, roomId },
  });
  return response.json();
}

/**
 * 게임 시작
 */
export async function startGame(page: Page, roomId: string) {
  try {
    const response = await page.request.post(`${API_BASE_URL}/rooms/${roomId}/games/start`, {
      timeout: 15000,
    });

    if (!response.ok()) {
      throw new Error(`Start game failed with status ${response.status()}`);
    }

    const result = await response.json() as ApiResponse<{ gameId: string; currentPhase: string; dayCount: number }>;
    validateApiResponse(result, 'startGame');
    return result;
  } catch (error) {
    throw new Error(`Start game request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 게임 상태 조회
 */
export async function getGameState(page: Page, gameId: string) {
  const response = await page.request.get(`${API_BASE_URL}/games/${gameId}`);
  return response.json();
}

/**
 * 내 역할 조회
 */
export async function getMyRole(page: Page, gameId: string, userId: string) {
  const response = await page.request.get(`${API_BASE_URL}/games/${gameId}/my-role?userId=${userId}`);
  return response.json() as Promise<ApiResponse<{ role: string; isAlive: boolean }>>;
}

/**
 * 게임 플레이어 목록 조회
 */
export async function getGamePlayers(page: Page, gameId: string) {
  const response = await page.request.get(`${API_BASE_URL}/games/${gameId}/players`);
  return response.json();
}

/**
 * 행동 등록 (투표, 능력 사용)
 */
export async function registerAction(page: Page, gameId: string, actionData: {
  type: string;
  actorUserId: string;
  targetUserId?: string;
}) {
  const response = await page.request.post(`${API_BASE_URL}/games/${gameId}/actions`, {
    data: actionData,
  });
  return response.json();
}

/**
 * 투표 현황 조회
 */
export async function getVoteStatus(page: Page, gameId: string, dayCount: number) {
  const response = await page.request.get(`${API_BASE_URL}/games/${gameId}/votes?dayCount=${dayCount}`);
  return response.json();
}

/**
 * 다음 페이즈로 전환
 */
export async function nextPhase(page: Page, gameId: string) {
  const response = await page.request.post(`${API_BASE_URL}/games/${gameId}/next-phase`, {});
  return response.json();
}

/**
 * 경찰 조사 결과 조회
 */
export async function getPoliceCheckResults(page: Page, gameId: string, userId: string) {
  const response = await page.request.get(`${API_BASE_URL}/games/${gameId}/police-check-results?userId=${userId}`);
  return response.json();
}
