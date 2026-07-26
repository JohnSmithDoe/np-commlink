/**
 * Public API of the `commlink` data module (Sheriff barrel).
 *
 * Two eager slices, both about what the deck shows. `deck` is the user's
 * navigation configuration — which programs the grid and the side menu list,
 * and in what order — resolved against the catalog in `commlink/model`. It
 * belongs here because a domain owns the routes it *serves*, not its own
 * presentation in navigation; see `docs/dashboard-customization-plan.md`.
 *
 * The other holds the dashboard READ-MODEL — the CQRS query side of the
 * telemetry contract. The write side (the published `DashboardActions.report` +
 * `IDashboardTelemetry` + `createTelemetryEffect`) deliberately stays in
 * `@shared/data`, so the nine supplier contexts push their metrics without
 * anyone importing `commlink`. Only its two consumers — the deck page and the
 * app shell's notification badge — reach in here, and both do so through
 * `DashboardFacade`.
 *
 * UNLIKE every other `<domain>/data`, this slice is EAGER: `commlinkContext`
 * is composed by `provideAppKernel()` rather than by a route's `providers`, and
 * it carries no hydration resolver, because the deck is the `**` fallback route
 * and the badge is always-on — a sink every module writes to cannot be scoped
 * to one producer's route lifecycle.
 *
 * Named re-exports only (never `export *`). The reducer, the effects, the
 * read-model action group and `dashboard.selector` stay module internals: the
 * shell composes the providers, the two consumers read the facade.
 */
export { DashboardFacade } from './dashboard.facade';
export { DeckFacade } from './deck.facade';
export { commlinkContext } from './commlink.providers';
