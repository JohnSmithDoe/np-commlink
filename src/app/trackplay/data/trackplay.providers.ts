import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { selectGameCount } from './games/games.selector';
import { TrackplayActions } from './trackplay.actions';
import { trackplayReducer } from './trackplay.reducer';
import {
  gamesListEffects,
  gameTypesListEffects,
  playersListEffects,
  trackplayRouteFilterEffects,
} from './trackplay-list.effects';
import {
  TRACKPLAY_STATE_KEY,
  selectTrackplayPersisted,
} from './trackplay.selector';

export const trackplayContext = providePersistedContext({
  key: TRACKPLAY_STATE_KEY,
  reducer: trackplayReducer,
  lifecycle: TrackplayActions,
  select: selectTrackplayPersisted,
  save: {
    sources: [
      '[Trackplay]',
      '[Trackplay Players]',
      '[Trackplay Games]',
      '[Trackplay GamesForPlayer]',
      '[Trackplay GameTypes]',
    ],
  },
  telemetry: [
    {
      source: 'trackplay',
      select: selectGameCount,
      metrics: createMetric('games'),
    },
  ],
  effects: [
    playersListEffects,
    gamesListEffects,
    gameTypesListEffects,
    trackplayRouteFilterEffects,
  ],
});
