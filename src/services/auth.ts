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

export class AuthService {
  /**
   * 회원가입 (세션 등록)
   */
  async signup(nickname: string): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse>("/auth/signup", { nickname });
  }

  /**
   * 현재 세션 확인 (POST /auth/current)
   */
  async checkCurrent(): Promise<ApiResponse<CurrentSessionResponse>> {
    const userId = localStorage.getItem('mafia_session_id');
    if (!userId) {
      return { success: false, error: 'No session found' };
    }
    return apiClient.post<CurrentSessionResponse>("/auth/current", { userId });
  }

  /**
   * 세션 확인
   */
  async checkSession(sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/auth/session/${sessionId}`);
  }

  /**
   * 로그아웃 (세션 삭제)
   */
  async logout(sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`/auth/session/${sessionId}`);
  }
}

export const authService = new AuthService();
