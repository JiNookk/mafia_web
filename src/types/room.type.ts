export interface RoomSummary {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  status: "AVAILABLE" | "IN_GAME" | "FULL";
}

export interface CreateRoomDto {
  username: string;
  roomName: string;
}

export interface RoomMemberResponse {
  userId: string;
  nickname: string;
  role: 'HOST' | 'PARTICIPANT';
}

export interface RoomDetailResponse {
  id: string;
  name: string;
  members: RoomMemberResponse[];
  currentPlayers: number;
  maxPlayers: number;
  gameId?: number;
}

export enum ChatType {
  WAITING_ROOM = 'WAITING_ROOM',
  GAME_ALL = 'GAME_ALL',
  GAME_MAFIA = 'GAME_MAFIA',
  GAME_DEAD = 'GAME_DEAD'
}

export interface ChatMessageDto {
  id: number;
  roomId: string;
  userId: string;
  nickname: string;
  chatType: ChatType;
  message: string;
  timestamp: string;
}

export interface SendChatDto {
  userId: string;
  chatType: ChatType;
  message: string;
}
