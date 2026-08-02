import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  Game,
  GameConfig,
  GameType,
  Player,
  PlayersConfig,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    load: emptyProps(),
    loaded: (trackplay: TrackplayState | null) => ({ trackplay }),

    enterGamePage: (gameId: TrackplayId) => ({ gameId }),

    createPlayer: (name: string) => ({ name }),
    renamePlayer: (playerId: TrackplayId, name: string) => ({ playerId, name }),
    deletePlayer: (player: Player) => ({ player }),

    createGame: (game: Game) => ({ game }),
    renameGame: (gameId: TrackplayId, name: string) => ({ gameId, name }),
    changeGameType: (gameId: TrackplayId, typeId: TrackplayId) => ({
      gameId,
      typeId,
    }),
    setGamePlayers: (gameId: TrackplayId, players: TrackplayId[]) => ({
      gameId,
      players,
    }),
    toggleGameEnded: (gameId: TrackplayId) => ({ gameId }),
    deleteGame: (game: Game) => ({ game }),

    createGameType: (name: string, winHigh: boolean) => ({ name, winHigh }),
    updateGameType: (gameType: GameType) => ({ gameType }),
    deleteGameType: (gameType: GameType) => ({ gameType }),

    setRoundValue: (
      gameId: TrackplayId,
      roundId: TrackplayId,
      playerId: TrackplayId,
      value: number,
      now: number = Date.now()
    ) => ({ gameId, roundId, playerId, value, now }),

    updateGamesConfig: (config: Partial<GameConfig>) => ({ config }),
    updateGamesForPlayerConfig: (config: Partial<GameConfig>) => ({
      config,
    }),
    updatePlayersConfig: (config: Partial<PlayersConfig>) => ({ config }),

    restoreLastDeleted: emptyProps(),
  },
});
