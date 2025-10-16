import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { gameService } from '@/services/game';
import { roomsService } from '@/services/rooms';
import {
  GameStateResponse,
  MyRoleResponse,
  GamePlayerResponse,
  VoteStatusResponse,
  GamePhase
} from '@/types/game.type';

export interface PlayerWithVotes extends GamePlayerResponse {
  voteCount: number;
}

export function useGameState(roomId: string, myUserId: string, gameId?: string) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [myRole, setMyRole] = useState<MyRoleResponse | null>(null);
  const [players, setPlayers] = useState<PlayerWithVotes[]>([]);
  const [voteStatus, setVoteStatus] = useState<VoteStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadVoteStatus = async (gameId: string, dayCount: number) => {
    try {
      const response = await gameService.getVoteStatus(gameId, dayCount);
      if (response.success && response.data) {
        setVoteStatus(response.data);
        setPlayers(prev => prev.map(p => ({
          ...p,
          voteCount: response.data?.voteCount[p.userId] || 0
        })));
      }
    } catch (error) {
      console.error('Failed to load vote status:', error);
    }
  };

  useEffect(() => {
    const loadGameData = async () => {
      try {
        if (!gameId) {
          toast.error('게임 ID가 없습니다');
          router.push(`/rooms/${roomId}`);
          return;
        }

        const [stateRes, roleRes, playersRes] = await Promise.all([
          gameService.getGameState(gameId),
          gameService.getMyRole(gameId, myUserId),
          gameService.getPlayers(gameId)
        ]);

        if (stateRes.success && stateRes.data) {
          setGameState(stateRes.data);
        }

        if (roleRes.success && roleRes.data) {
          setMyRole(roleRes.data);
        }

        if (playersRes.success && playersRes.data) {
          setPlayers(playersRes.data.players.map(p => ({ ...p, voteCount: 0 })));
        }

        if (stateRes.data?.currentPhase === GamePhase.VOTE) {
          loadVoteStatus(gameId, stateRes.data.dayCount);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load game data:', error);
        toast.error('게임 데이터를 불러올 수 없습니다');
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [roomId, myUserId, gameId, router]);

  return {
    gameState,
    setGameState,
    myRole,
    players,
    setPlayers,
    voteStatus,
    loadVoteStatus,
    isLoading
  };
}
