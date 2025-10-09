export interface RoomSummary {
  id: string;

  title: string;

  players: number;

  maxPlayers: number;

  status: "대기중" | "게임중" | "풀방";
}
