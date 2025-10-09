import { apiClient, ApiResponse } from "@/lib/api";

export interface SignupRequest {
  nickname: string;
}

export interface SignupResponse {
  sessionId: string;
  nickname: string;
  createdAt: string;
}

export class AuthService {
  /**
   * 회원가입 (세션 등록)
   */
  async signup(nickname: string): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse>("/auth/signup", { nickname });
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
