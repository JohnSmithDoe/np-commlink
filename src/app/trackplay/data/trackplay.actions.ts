import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  Game,
  GameType,
  Player,
  TrackplayState,
} from '../model/trackplay.types';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    load: emptyProps(),
    loaded: (trackplay: TrackplayState | null) => ({ trackplay }),
    restorePlayer: (player: Player, games: readonly Game[]) => ({
      player,
      games,
    }),
    restoreGameType: (gameType: GameType, games: readonly Game[]) => ({
      gameType,
      games,
    }),
  },
});
