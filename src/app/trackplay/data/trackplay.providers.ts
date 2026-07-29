import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { TrackplayActions } from './actions/trackplay.actions';
import { trackplayReducer } from './reducer/trackplay.reducer';
import { TrackplayEffects } from './effects/trackplay.effects';
import {
  selectGameCount,
  selectTrackplayPersisted,
} from './selectors/trackplay.selector';

/**
 * The `trackplay` bounded context, registered on ALL trackplay routes
 * (`/trackplay`, `/trackplay/players`, `/trackplay/player/:id`,
 * `/trackplay/game-types`, `/trackplay/game/:id`) — the same bundle on each, so
 * navigating between sub-pages keeps the one slice present. Trackplay is fully
 * self-contained: no other route reads or dispatches `[Trackplay]`.
 *
 * Every `[Trackplay]` action persists — `enterGamePage` included, since it is the
 * one page hook that can mutate (it appends the trailing blank round).
 */
export const trackplayContext = providePersistedContext({
  key: 'trackplay',
  reducer: trackplayReducer,
  lifecycle: TrackplayActions,
  select: selectTrackplayPersisted,
  save: { sources: ['[Trackplay]'] },
  telemetry: [
    {
      source: 'trackplay',
      select: selectGameCount,
      metrics: createMetric('games'),
    },
  ],
  effects: [TrackplayEffects],
});
