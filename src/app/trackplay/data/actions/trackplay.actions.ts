import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IGame,
  IGameType,
  IGameConfig,
  IPlayer,
  ITrackplayState,
  TID,
} from '../../model/trackplay.types';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    // Own-data lazy load lifecycle. The generic save effect matches every
    // [Trackplay] action but excludes the load/loaded lifecycle itself.
    load: emptyProps(),
    loaded: (trackplay: ITrackplayState | null) => ({ trackplay }),

    // ── Page entry (also ensures the trailing blank round) ───────────────────
    enterGamePage: (gameId: TID) => ({ gameId }),

    // ── Players ──────────────────────────────────────────────────────────────
    createPlayer: (name: string) => ({ name }),
    renamePlayer: (playerId: TID, name: string) => ({ playerId, name }),
    deletePlayer: (player: IPlayer) => ({ player }),

    // ── Games ──────────────────────────────────────────────────────────────
    // Carries a pre-minted game, unlike the two create actions below: the game
    // dialog navigates to what it just created, so the id has to exist before the
    // dispatch (it used to diff the games map afterwards to guess it).
    createGame: (game: IGame) => ({ game }),
    renameGame: (gameId: TID, name: string) => ({ gameId, name }),
    changeGameType: (gameId: TID, typeId: TID) => ({ gameId, typeId }),
    setGamePlayers: (gameId: TID, players: TID[]) => ({ gameId, players }),
    toggleGameEnded: (gameId: TID) => ({ gameId }),
    deleteGame: (game: IGame) => ({ game }),

    // ── Game types ───────────────────────────────────────────────────────────
    createGameType: (name: string, winHigh: boolean) => ({ name, winHigh }),
    updateGameType: (gameType: IGameType) => ({ gameType }),
    deleteGameType: (gameType: IGameType) => ({ gameType }),

    // ── Rounds / scoring ─────────────────────────────────────────────────────
    // Entering a value on the trailing blank round auto-appends the next blank
    // round; any edit bumps the game's `updated` + participants' `lastPlayed`.
    setRoundValue: (
      gameId: TID,
      roundId: TID,
      playerId: TID,
      value: number
    ) => ({ gameId, roundId, playerId, value }),

    // ── Per-list sort/filter config ──────────────────────────────────────────
    updateGamesConfig: (config: Partial<IGameConfig>) => ({ config }),
    updateGamesForPlayerConfig: (config: Partial<IGameConfig>) => ({
      config,
    }),
    updatePlayersConfig: (config: {
      sort?: 'name' | 'date' | 'last';
      dir?: 'asc' | 'desc';
      filter?: string;
    }) => ({ config }),

    // ── Undo ─────────────────────────────────────────────────────────────────
    restoreLastDeleted: emptyProps(),
  },
});
