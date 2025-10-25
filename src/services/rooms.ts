import { apiClient, ApiResponse } from "@/lib/api";
import { OffsetPagination } from "@/types/pagination.type";
import { RoomSummary, CreateRoomDto, RoomDetailResponse, ChatMessageDto, SendChatDto, ChatType } from "@/types/room.type";

export class RoomsService {
  async getLists(): Promise<ApiResponse<OffsetPagination<RoomSummary>>> {
    return apiClient.get<OffsetPagination<RoomSummary>>("/rooms");
  }

  async createRoom(data: CreateRoomDto): Promise<ApiResponse<RoomDetailResponse>> {
    return apiClient.post<RoomDetailResponse, CreateRoomDto>("/rooms", data);
  }

  async joinRoom(roomId: string, username: string): Promise<ApiResponse<RoomDetailResponse>> {
    return apiClient.post<RoomDetailResponse, { username: string; roomId: string }>(`/rooms/${roomId}/join`, { username, roomId });
  }

  async getRoomDetail(roomId: string): Promise<ApiResponse<RoomDetailResponse>> {
    return apiClient.get<RoomDetailResponse>(`/rooms/${roomId}`);
  }

  async leaveRoom(roomId: string, userId: string): Promise<ApiResponse<void>> {
    return apiClient.post<void, { userId: string }>(`/rooms/${roomId}/leave`, { userId });
  }

  async getChatHistory(roomId: string, userId: string, chatType: ChatType, limit: number = 50): Promise<ApiResponse<ChatMessageDto[]>> {
    return apiClient.get<ChatMessageDto[]>(`/rooms/${roomId}/chat?userId=${userId}&chatType=${chatType}&limit=${limit}`);
  }

  async sendChat(roomId: string, data: SendChatDto): Promise<ApiResponse<ChatMessageDto>> {
    return apiClient.post<ChatMessageDto, SendChatDto>(`/rooms/${roomId}/chat`, data);
  }
}

// 싱글톤 인스턴스 export
export const roomsService = new RoomsService();
