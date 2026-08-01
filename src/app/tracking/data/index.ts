/**
 * Public API of the `tracking` data module (Sheriff barrel).
 *
 * Facade-only surface for production code — the two facades, the action contract
 * and the lazy context bundle. The reducer, effects, initial state and pure
 * utils are module internals and stay hidden: importing them from outside
 * `tracking/data` is a Sheriff encapsulation violation.
 *
 * The exceptions are documented rather than hidden: the session selectors below
 * have **no production consumer** — they exist so a component spec can
 * `overrideSelector` the aggregate a facade signal reads. That used to be the
 * seam keeping those specs off the wall clock; the clock is now an argument
 * (`util/sessions.utils` + `TodayService`), so what they buy is only the shorter
 * setup. Everything else a spec needs it seeds as state.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { TrackingActions } from './tracking.actions';

export {
  selectAllTrackingSessions,
  selectArchivedSessions,
  selectLiveChartSessions,
} from './tracking.selector';

// The timer + session archive
export { TrackingFacade } from './tracking.facade';

// The activity list — what drives the shared, domain-blind ListPageComponent
export { TrackingListPageFacade } from './tracking-list-page.facade';

// Lazy context bundle (state + effects + hydration resolver, per-route)
export { trackingContext } from './tracking.providers';
