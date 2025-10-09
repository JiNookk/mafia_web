import { apiClient, ApiResponse } from "@/lib/api";
import { OffsetPagination } from "@/types/pagination.type";
import { RoomSummary } from "@/types/room.type";

export class RoomsService {
  async getLists(): Promise<ApiResponse<OffsetPagination<RoomSummary>>> {
    return apiClient.get<OffsetPagination<RoomSummary>>("/rooms");
  }
}

// 싱글톤 인스턴스 export
export const roomsService = new RoomsService();
