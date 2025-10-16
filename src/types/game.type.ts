export enum GamePhase {
  NIGHT = 'NIGHT',
  DAY = 'DAY',
  VOTE = 'VOTE',
  DEFENSE = 'DEFENSE',
  RESULT = 'RESULT'
}

export enum GameRole {
  CITIZEN = 'CITIZEN',
  MAFIA = 'MAFIA',
  DOCTOR = 'DOCTOR',
  POLICE = 'POLICE'
}

export enum ActionType {
  VOTE = 'VOTE',
  KILL = 'KILL',
  HEAL = 'HEAL',
  INVESTIGATE = 'INVESTIGATE'
}

export interface GameStateResponse {
  gameId: string;
  currentPhase: GamePhase;
  dayCount: number;
  phaseStartTime: string;
  phaseDurationSeconds: number;
  remainingSeconds: number;
  winnerTeam?: string;
  finishedAt?: string;
}

export interface MyRoleResponse {
  role: GameRole;
  isAlive: boolean;
  position: number;
}

export interface GamePlayerResponse {
  userId: string;
  username: string;
  position: number;
  isAlive: boolean;
  diedAt?: string;
}

export interface GamePlayersResponse {
  players: GamePlayerResponse[];
}

export interface RegisterActionDto {
  type: ActionType;
  targetUserId: string;
  actorUserId?: string;
}

export interface VoteInfo {
  voterUserId: string;
  targetUserId: string;
}

export interface VoteStatusResponse {
  votes: VoteInfo[];
  voteCount: Record<string, number>;
}

export interface PhaseResult {
  deaths?: string[];
  executedUserId?: string;
  winnerTeam?: string;
}

export interface NextPhaseResponse {
  currentPhase: GamePhase;
  dayCount: number;
  phaseStartTime: string;
  phaseDurationSeconds: number;
  lastPhaseResult?: PhaseResult;
}
