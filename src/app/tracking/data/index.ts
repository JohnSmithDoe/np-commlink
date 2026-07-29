/**
 * Public API of the `tracking` data module (Sheriff barrel).
 *
 * Facade-only surface for production code — the two facades, the action contract
 * and the lazy context bundle. The reducer, effects, initial state and pure
 * utils are module internals and stay hidden: importing them from outside
 * `tracking/data` is a Sheriff encapsulation violation.
 *
 * The one exception is documented rather than hidden: the two chart/session
 * selectors below have **no production consumer** — they exist so a component
 * spec can `overrideSelector` the aggregate a facade signal reads, which is the
 * seam that keeps those specs off the wall clock (the 21-day window and "today"
 * both derive from `dayjs()`). Everything else a spec needs it seeds as state.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { TrackingActions } from './actions/tracking.actions';

export {
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
} from './selectors/tracking.selector';
export type { DailySeries } from './selectors/tracking.selector';

// The timer + session archive
export { TrackingFacade } from './tracking.facade';

// The activity list — what drives the shared, domain-blind ListPageComponent
export { TrackingListPageFacade } from './tracking-list-page.facade';

// Lazy context bundle (state + effects + hydration resolver, per-route)
export { trackingContext } from './tracking.providers';
