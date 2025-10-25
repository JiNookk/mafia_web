import { apiClient, ApiResponse } from "@/lib/api";

export interface SignupRequest {
  nickname: string;
}

export interface SignupResponse {
  userId: string;
  nickname: string;
  roomId: string | null;
}

export interface CurrentSessionResponse {
  userId: string;
  nickname: string;
  currentRoom?: {
    roomId: string;
    gameId?: string;
  } | null;
}

export interface SessionRequestDto {
  userId: string;
}

export interface SessionResponse {
  valid: boolean;
  userId?: string;
  nickname?: string;
}

export interface LogoutResponse {
  success: boolean;
}

export class AuthService {
  /**
   * 회원가입 (세션 등록)
   */
  async signup(nickname: string): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse, { nickname: string }>("/auth/signup", { nickname });
  }

  /**
   * 현재 세션 확인 (POST /auth/current)
   */
  async checkCurrent(): Promise<ApiResponse<CurrentSessionResponse>> {
    const userId = localStorage.getItem('mafia_session_id');
    if (!userId) {
      return { success: false, error: 'No session found' };
    }
    return apiClient.post<CurrentSessionResponse, { userId: string }>("/auth/current", { userId });
  }

  /**
   * 세션 확인
   */
  async checkSession(sessionId: string): Promise<ApiResponse<SessionResponse>> {
    return apiClient.get<SessionResponse>(`/auth/session/${sessionId}`);
  }

  /**
   * 로그아웃 (세션 삭제)
   */
  async logout(sessionId: string): Promise<ApiResponse<LogoutResponse>> {
    return apiClient.delete<LogoutResponse>(`/auth/session/${sessionId}`);
  }
}

export const authService = new AuthService();
