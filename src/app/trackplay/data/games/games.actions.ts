/* ─── why ─────────────────────────────────────────────────────────
 * These carry an `id` and an `at` they could have read themselves, because
 * their handlers reach `createRound` and whether to append depends on
 * state — so the decision cannot move to dispatch time, only the MINTING
 * can. That is what keeps the reducer a function of `(state, action)`: the
 * action log determines the state it produced, and a spec can pass an
 * explicit id. The defaults keep every call site unchanged.
 *
 * `setShowEnded` is its own event rather than a `filterBy` token because
 * the list filters on two independent axes — see the model banner.
 * ───────────────────────────────────────────────────────────────── */

import { createActionGroup } from '@ngrx/store';
import dayjs from 'dayjs';
import { Timestamp } from '../../../@shared/model/app.types';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { Game, TrackplayId } from '../../model/trackplay.types';

export const GamesActions = createActionGroup({
  source: 'Trackplay Games',
  events: {
    ...createItemListActionEvents<Game>(),

    setShowEnded: (showEndedGames: boolean) => ({ showEndedGames }),

    enterGamePage: (gameId: TrackplayId, roundId: TrackplayId = uuidv4()) => ({
      gameId,
      roundId,
    }),

    setRoundValue: (
      gameId: TrackplayId,
      roundId: TrackplayId,
      playerId: TrackplayId,
      value: number,
      at: Timestamp = dayjs().format(),
      nextRoundId: TrackplayId = uuidv4()
    ) => ({ gameId, roundId, playerId, value, at, nextRoundId }),
  },
});
