/**
 * Public API of the `tracking` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the two action contracts, the display
 * selectors, and the lazy providers, and nothing else. The reducers, effects
 * (load/save/search/telemetry/notifications), initial state, internal
 * selectors, and pure utils are module internals and stay hidden: importing
 * them from outside `tracking/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

// Action contracts
export { TrackingActions } from './tracking.actions';
export { DialogsActions } from './dialogs/dialogs.actions';

// Tracking selectors
export {
  selectTrackingData,
  selectTrackingDataViewId,
  selectListItemsTracking,
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
  selectTrackingTime,
} from './tracking.selector';
export type { DailySeries } from './tracking.selector';

// Dialog selectors
export {
  selectEditItem,
  selectEditState,
  selectEditItemTracking,
} from './dialogs/dialogs.selector';

// Lazy providers (state + effects, registered per-route)
export { trackingLazyProviders } from './provide-tracking-lazy';
