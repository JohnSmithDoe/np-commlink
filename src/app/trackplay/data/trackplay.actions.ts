import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IGame,
  IGameType,
  IGameConfig,
  IPlayer,
  ITrackplayState,
  TID,
} from '../model';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2). saveGroceryOnChange$
    // matches [Trackplay] but excludes the load/loaded lifecycle.
    load: emptyProps(),
    loaded: (trackplay: ITrackplayState | null) => ({ trackplay }),

    // ── Page entry (orchestration hooks; also ensure derived shape) ──────────
    'Enter Games Page': emptyProps(),
    'Enter Players Page': emptyProps(),
    'Enter Player Page': (playerId: TID) => ({ playerId }),
    'Enter Game Types Page': emptyProps(),
    'Enter Game Page': (gameId: TID) => ({ gameId }),

    // ── Players ──────────────────────────────────────────────────────────────
    'Create Player': (name: string) => ({ name }),
    'Rename Player': (playerId: TID, name: string) => ({ playerId, name }),
    'Delete Player': (player: IPlayer) => ({ player }),

    // ── Games ──────────────────────────────────────────────────────────────
    'Create Game': (name: string, players: TID[] = []) => ({ name, players }),
    'Rename Game': (gameId: TID, name: string) => ({ gameId, name }),
    'Change Game Type': (gameId: TID, typeId: TID) => ({ gameId, typeId }),
    'Set Game Players': (gameId: TID, players: TID[]) => ({ gameId, players }),
    'Toggle Game Ended': (gameId: TID) => ({ gameId }),
    'Delete Game': (game: IGame) => ({ game }),

    // ── Game types ───────────────────────────────────────────────────────────
    'Create Game Type': (name: string, winHigh: boolean) => ({ name, winHigh }),
    'Update Game Type': (gameType: IGameType) => ({ gameType }),
    'Delete Game Type': (gameType: IGameType) => ({ gameType }),

    // ── Rounds / scoring ─────────────────────────────────────────────────────
    // Entering a value on the trailing blank round auto-appends the next blank
    // round; any edit bumps the game's `updated` + participants' `lastPlayed`.
    'Set Round Value': (
      gameId: TID,
      roundId: TID,
      playerId: TID,
      value: number
    ) => ({ gameId, roundId, playerId, value }),

    // ── Per-list sort/filter config ──────────────────────────────────────────
    'Update Games Config': (config: Partial<IGameConfig>) => ({ config }),
    'Update Games For Player Config': (config: Partial<IGameConfig>) => ({
      config,
    }),
    'Update Players Config': (config: {
      sort?: 'name' | 'date' | 'last';
      dir?: 'asc' | 'desc';
      filter?: string;
    }) => ({ config }),

    // ── Undo ─────────────────────────────────────────────────────────────────
    'Restore Last Deleted': emptyProps(),
  },
});
