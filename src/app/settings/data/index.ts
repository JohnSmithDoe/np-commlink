/**
 * Public API of the `settings` data module (Sheriff barrel).
 *
 * The app-global settings slice — the selected UI `theme` and its accent
 * overrides. Sealed into its own domain (was `@shared/data/settings`):
 * its only reader is this domain's settings page, so it no longer needs to live
 * in the shared kernel bucket.
 *
 * UNLIKE a normal routed `<domain>/data`, this slice is EAGER — its state,
 * effects and boot load ride in `settingsContext`, composed by
 * `provideAppKernel()` rather than by a route's `providers`, because the theme
 * must apply under the boot splash before first paint. Ownership (this domain)
 * and lifecycle (eager) are independent axes — same pattern as the
 * commlink-owned `dashboard` slice.
 *
 * Named re-exports only. The reducer, the effects, the action group and
 * `settings.selector`/`initialSettings` stay module internals: the facade is
 * the only reader.
 */
export { SettingsFacade } from './settings.facade';
export { settingsContext } from './settings.providers';
