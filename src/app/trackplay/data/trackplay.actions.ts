import { createActionGroup, emptyProps } from '@ngrx/store';
import { PersonId } from '../../@shared/model/person.types';
import { Game, GameType, TrackplayState } from '../model/trackplay.types';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    load: emptyProps(),
    loaded: (trackplay: TrackplayState | null) => ({ trackplay }),
    restoreGameType: (gameType: GameType, games: readonly Game[]) => {
      return {
        gameType,
        games,
      };
    },
    sweepOrphans: (people: readonly PersonId[]) => ({ people }),
  },
});
