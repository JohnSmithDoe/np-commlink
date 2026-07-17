import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { trackingReducer } from './tracking.reducer';
import { dialogsReducer } from './dialogs/dialogs.reducer';
import { TrackingLoadEffects } from './tracking-load.effects';
import { TrackingEffects } from './tracking.effects';
import { ItemListEffects } from './item-list.effects';
import { DialogsEffects } from './dialogs/dialogs.effects';
import { TrackingSearchEffects } from './tracking-search.effects';
import { TrackingSaveEffects } from './tracking-save.effects';
import { TrackingTelemetryEffects } from './tracking-telemetry.effects';
import { TrackingNotificationsEffects } from './tracking-notifications.effects';

/**
 * Lazy state + effects for the `tracking` bounded context (lazy-modules §7).
 * Registered on the two routes that read `state.tracking` — `/tracking` (the
 * tracker) and `/data/:listId` (the stats page) — and hydrated by
 * `moduleHydrationResolver(TrackingActions.load, .loaded)` on each.
 *
 * Two slices: `tracking` (the tracked items) and `dialogs` (the tracking
 * edit-dialog UI state, used only on /tracking). Co-registered as one context.
 *
 * Everything that touches tracking rides here so no `store.select` ever hits an
 * unregistered slice:
 * - load (own key → `loaded`), save-on-change, the item-flow orchestration
 *   (`TrackingSearchEffects`) and the item-list engine bridge (`ItemListEffects`)
 * - `TrackingNotificationsEffects` — reconcile (fires on tracking mutations) +
 *   applyNotificationCommand (the /notifications CTA deep-links here); both fire
 *   only while a tracking route is active, and dispatch into the eager
 *   notifications sink (§7)
 * - `TrackingTelemetryEffects` — pushes the item count to the eager dashboard
 *   read-model; cold-launch count comes from the persisted summary
 *
 * This is what removes the eager `tracking`/`dialogs` registrations from
 * `provideStore` and the boot `TrackingActions.load()` from `main.ts`.
 */
export const trackingLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('tracking', trackingReducer),
  provideState('dialogs', dialogsReducer),
  provideEffects(
    TrackingLoadEffects,
    TrackingEffects,
    ItemListEffects,
    DialogsEffects,
    TrackingSearchEffects,
    TrackingSaveEffects,
    TrackingTelemetryEffects,
    TrackingNotificationsEffects
  ),
];
