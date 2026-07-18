import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { trackingReducer } from './tracking.reducer';
import { TrackingLoadEffects } from './tracking-load.effects';
import { TrackingEffects } from './tracking.effects';
import { TrackingListEffects } from './tracking-list.effects';
import { TrackingItemDialogsEffects } from './tracking-item-dialogs.effects';
import { TrackingSaveEffects } from './tracking-save.effects';
import { TrackingTelemetryEffects } from './tracking-telemetry.effects';
import { TrackingNotificationsEffects } from './tracking-notifications.effects';

/**
 * Lazy state + effects for the `tracking` bounded context (lazy-modules §7).
 * Registered on the two routes that read `state.tracking` — `/tracking` (the
 * tracker) and `/data/:listId` (the stats page) — and hydrated by
 * `moduleHydrationResolver(TrackingActions.load, .loaded)` on each.
 *
 * A single slice: `tracking` (the tracked items). The edit-dialog UI state now
 * rides on the shared, eager `itemDialogs` open-command slice (the established
 * grocery/tasks flow) — tracking no longer forks its own `dialogs` slice.
 *
 * Everything that touches the tracking slice rides here so no `store.select`
 * ever hits an unregistered slice:
 * - load (own key → `loaded`), save-on-change, the item-flow orchestration
 *   (`TrackingListEffects`) and the dialog open-command producer
 *   (`TrackingItemDialogsEffects`, guarded on `listId === '_tracking'`)
 * - `TrackingNotificationsEffects` — reconcile (fires on tracking mutations) +
 *   applyNotificationCommand (the /notifications CTA deep-links here); both fire
 *   only while a tracking route is active, and dispatch into the eager
 *   notifications sink (§7)
 * - `TrackingTelemetryEffects` — pushes the item count to the eager dashboard
 *   read-model; cold-launch count comes from the persisted summary
 *
 * This is what removes the eager `tracking` registration from `provideStore`
 * and the boot `TrackingActions.load()` from `main.ts`.
 */
export const trackingLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('tracking', trackingReducer),
  provideEffects(
    TrackingLoadEffects,
    TrackingEffects,
    TrackingListEffects,
    TrackingItemDialogsEffects,
    TrackingSaveEffects,
    TrackingTelemetryEffects,
    TrackingNotificationsEffects
  ),
];
