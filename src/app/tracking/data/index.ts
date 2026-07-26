/**
 * Public API of the `tracking` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the display
 * selectors, the list-page facade, and the lazy context bundle, and nothing
 * else. The reducer, effects, initial state, internal selectors, and pure utils
 * are module internals and stay hidden: importing them from outside
 * `tracking/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { TrackingActions } from './actions/tracking.actions';

export {
  selectTrackingData,
  selectTrackingDataViewId,
  selectTrackingListItems,
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
  selectTrackingTime,
} from './selectors/tracking.selector';
export type { DailySeries } from './selectors/tracking.selector';

// List-page facade — what drives the shared, domain-blind ListPageComponent
export { TrackingListPageFacade } from './tracking-list-page.facade';

// Lazy context bundle (state + effects + hydration resolver, per-route)
export { trackingContext } from './tracking.providers';
