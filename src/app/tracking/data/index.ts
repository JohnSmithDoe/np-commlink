/**
 * Public API of the `tracking` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the display
 * selectors, the list-page facade, and the lazy providers, and nothing else.
 * The reducer, effects (load/save/list/dialogs/telemetry/notifications), initial
 * state, internal selectors, and pure utils are module internals and stay
 * hidden: importing them from outside `tracking/data` is a Sheriff
 * encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { TrackingActions } from './tracking.actions';

export {
  selectTrackingData,
  selectTrackingDataViewId,
  selectTrackingListItems,
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
  selectTrackingTime,
} from './tracking.selector';
export type { DailySeries } from './tracking.selector';

// The tracking context's typed view of the shared, domain-blind itemDialogs slice
export { selectEditTrackingItem } from './item-dialogs.selector';

// List-page facade — what drives the shared, domain-blind ListPageComponent
export { TrackingListPageFacade } from './tracking-list-page.facade';

// Lazy providers (state + effects, registered per-route)
export { trackingLazyProviders } from './provide-tracking-lazy';
