import { components } from './api';

// API 스펙에서 타입 가져오기
export type GameStateResponse = components['schemas']['GameStateResponse'];
export type MyRoleResponse = components['schemas']['MyRoleResponse'];
export type GamePlayerResponse = components['schemas']['GamePlayerResponse'];
export type GamePlayersResponse = components['schemas']['GamePlayersResponse'];
export type RegisterActionDto = components['schemas']['RegisterActionDto'];
export type VoteInfo = components['schemas']['VoteInfo'];
export type VoteStatusResponse = components['schemas']['VoteStatusResponse'];
export type PhaseResult = components['schemas']['PhaseResult'];
export type NextPhaseResponse = components['schemas']['NextPhaseResponse'];
export type CheckResult = components['schemas']['CheckResult'];
export type PoliceCheckResultResponse = components['schemas']['PoliceCheckResultResponse'];

// Enum 타입들 (API 스펙의 값과 일치)
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
  MAFIA_KILL = 'MAFIA_KILL',
  DOCTOR_HEAL = 'DOCTOR_HEAL',
  POLICE_CHECK = 'POLICE_CHECK'
}
