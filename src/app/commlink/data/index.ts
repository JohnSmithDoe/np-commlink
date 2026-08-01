/**
 * Public API of the `commlink` data module (Sheriff barrel) — two facades over
 * the domain's two slices, plus the providers bundle the kernel composes:
 *
 * - `DeckFacade` — the user's navigation configuration (which programs the grid
 *   and the side menu list, and in what order), resolved against the catalog in
 *   `commlink/model`; rationale in `docs/deck-catalog.md` §7.1.
 * - `DashboardFacade` — the dashboard READ-MODEL, the CQRS query side of the
 *   telemetry contract whose write side (`DashboardActions.report` +
 *   `IDashboardTelemetry` + `createTelemetrySliceEffect`) stays in
 *   `@shared/data`, so the nine supplier contexts push metrics without anyone
 *   importing `commlink`. Its only readers are the deck page and the shell's
 *   notification badge.
 * - `commlinkContext` — both slices' state + effects + boot hydration. Why they
 *   boot eagerly is argued once, in `commlink.providers.ts`.
 *
 * Named re-exports only (never `export *`). The reducers, the effects, the
 * read-model action group and `dashboard.selector` stay module internals: the
 * shell composes the providers, the two consumers read the facades.
 */
export { DashboardFacade } from './dashboard/dashboard.facade';
export { DeckFacade } from './deck/deck.facade';
export { commlinkContext } from './commlink.providers';
