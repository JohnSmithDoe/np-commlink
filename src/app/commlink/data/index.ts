/**
 * Public API of the `commlink` data module (Sheriff barrel).
 *
 * Holds the dashboard READ-MODEL — the CQRS query side of the telemetry
 * contract. The write side (the published `DashboardActions.report` +
 * `IDashboardTelemetry` + `createTelemetryEffect`) deliberately stays in
 * `@shared/data`, so the nine supplier contexts push their metrics without
 * anyone importing `commlink`. Only its two consumers — the deck page and the
 * app shell's notification badge — reach in here, and both do so through
 * `DashboardFacade`.
 *
 * UNLIKE every other `<domain>/data`, this slice is EAGER: `main.ts` registers
 * `dashboardReducer` + `DashboardEffects` in the root store, because the deck
 * is the `**` fallback route and the badge is always-on, and because a sink
 * every module writes to cannot be scoped to one producer's route lifecycle.
 * Hence no `provide-commlink-lazy.ts` and no hydration resolver — the boot
 * `DashboardReadModelActions.load()` in `provideAppInitializer` is the
 * hydration.
 *
 * Named re-exports only (never `export *`). `dashboard.selector` stays a module
 * internal: the facade is the only reader.
 */
export { DashboardFacade } from './dashboard.facade';
export { dashboardReducer, initialDashboardState } from './dashboard.reducer';
export { DashboardEffects } from './dashboard.effects';
export { DashboardReadModelActions } from './dashboard.actions';
