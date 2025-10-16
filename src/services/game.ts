import { apiClient, ApiResponse } from "@/lib/api";
import {
  GameStateResponse,
  MyRoleResponse,
  GamePlayersResponse,
  RegisterActionDto,
  VoteStatusResponse,
  NextPhaseResponse
} from "@/types/game.type";
import { ChatMessageDto, SendChatDto } from "@/types/room.type";

export class GameService {
  /**
   * 게임 시작
   * POST /api/rooms/{roomId}/games/start
   */
  async startGame(roomId: string): Promise<ApiResponse<GameStateResponse>> {
    return apiClient.post<GameStateResponse>(`/rooms/${roomId}/games/start`, {});
  }

  /**
   * 게임 상태 조회
   * GET /api/games/{gameId}
   */
  async getGameState(gameId: string): Promise<ApiResponse<GameStateResponse>> {
    return apiClient.get<GameStateResponse>(`/games/${gameId}`);
  }

  /**
   * 내 직업 조회
   * GET /api/games/{gameId}/my-role?userId={userId}
   */
  async getMyRole(gameId: string, userId: string): Promise<ApiResponse<MyRoleResponse>> {
    return apiClient.get<MyRoleResponse>(`/games/${gameId}/my-role?userId=${userId}`);
  }

  /**
   * 게임 참여자 목록
   * GET /api/games/{gameId}/players
   */
  async getPlayers(gameId: string): Promise<ApiResponse<GamePlayersResponse>> {
    return apiClient.get<GamePlayersResponse>(`/games/${gameId}/players`);
  }

  /**
   * 행동 등록 (투표, 마피아 살해, 의사 치료, 경찰 조사)
   * POST /api/games/{gameId}/actions
   */
  async registerAction(gameId: string, data: RegisterActionDto): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/games/${gameId}/actions`, data);
  }

  /**
   * 투표 현황 조회
   * GET /api/games/{gameId}/votes?dayCount={dayCount}
   */
  async getVoteStatus(gameId: string, dayCount: number): Promise<ApiResponse<VoteStatusResponse>> {
    return apiClient.get<VoteStatusResponse>(`/games/${gameId}/votes?dayCount=${dayCount}`);
  }

  /**
   * 다음 페이즈로 전환
   * POST /api/games/{gameId}/next-phase
   */
  async nextPhase(gameId: string): Promise<ApiResponse<NextPhaseResponse>> {
    return apiClient.post<NextPhaseResponse>(`/games/${gameId}/next-phase`, {});
  }

  /**
   * 게임 채팅 전송
   * POST /api/games/{gameId}/chat/{chatType}
   */
  async sendGameChat(gameId: string, chatType: string, data: SendChatDto): Promise<ApiResponse<ChatMessageDto>> {
    return apiClient.post<ChatMessageDto>(`/games/${gameId}/chat/${chatType}`, data);
  }

  /**
   * 게임 채팅 히스토리 조회
   * GET /api/games/{gameId}/chat/{chatType}
   */
  async getGameChatHistory(gameId: string, chatType: string, userId: string): Promise<ApiResponse<ChatMessageDto[]>> {
    return apiClient.get<ChatMessageDto[]>(`/games/${gameId}/chat/${chatType}?userId=${userId}`);
  }
}

// 싱글톤 인스턴스 export
export const gameService = new GameService();
