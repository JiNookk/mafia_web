export interface RoomSummary {
  id: string;

  title: string;

  players: number;

  maxPlayers: number;

  status: "대기중" | "게임중" | "풀방";
}

export interface CreateRoomDto {
  username: string;
  roomName: string;
}

export interface RoomMemberResponse {
  playerId: string;
  role: ParticipatingRole;
}

export interface RoomDetailResponse {
  id: string;
  name: string;
  members: RoomMemberResponse[];
  currentPlayers: number;
  maxPlayers: number;
}

export type ParticipatingRole = 'MAFIA' | 'CITIZEN' | 'DOCTOR' | 'POLICE';
