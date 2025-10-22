import { components } from './api';

// API 스펙에서 타입 가져오기
export type RoomListResponse = components['schemas']['RoomListResponse'];
export type CreateRoomDto = components['schemas']['CreateRoomDto'];
export type RoomMemberResponse = components['schemas']['RoomMemberResponse'];
export type RoomDetailResponse = components['schemas']['RoomDetailResponse'];
export type ChatMessageDto = components['schemas']['ChatMessageDto'];
export type SendChatDto = components['schemas']['SendChatDto'];

// RoomSummary는 RoomListResponse의 별칭
export type RoomSummary = RoomListResponse;

// ChatType enum (API 스펙의 값과 일치)
export enum ChatType {
  WAITING_ROOM = 'WAITING_ROOM',
  GAME_ALL = 'GAME_ALL',
  GAME_MAFIA = 'GAME_MAFIA',
  GAME_DEAD = 'GAME_DEAD'
}
