import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { TrackingActions } from './tracking.actions';
import { trackingReducer } from './tracking.reducer';
import { TrackingLoadEffects } from './effects/tracking-load.effects';
import { TrackingEffects } from './effects/tracking.effects';
import { TrackingListEffects } from './effects/tracking-list.effects';
import { TrackingSaveEffects } from './effects/tracking-save.effects';
import { TrackingTelemetryEffects } from './effects/tracking-telemetry.effects';
import { TrackingNotificationsEffects } from './effects/tracking-notifications.effects';
import { TrackingMessageEffects } from './effects/tracking-message.effects';

/**
 * Lazy state + effects for the `tracking` bounded context (lazy-modules §7).
 * Registered on the two routes that read `state.tracking` — `/tracking` (the
 * tracker) and `/data/:listId` (the stats page) — and hydrated by
 * `moduleHydrationResolver(TrackingActions.load, .loaded)` on each.
 *
 * A single slice: `tracking` (the tracked items). The edit dialog carries no
 * store state at all: the open-command lives on the root `ItemDialogHost` signal
 * service and the draft is local to the wrapper, so there is no dialog effect
 * here (and no `listId` guard to get wrong).
 *
 * Everything that touches the tracking slice rides here so no `store.select`
 * ever hits an unregistered slice:
 * - load (own key → `loaded`), save-on-change and the item-flow orchestration
 *   (`TrackingListEffects`)
 * - `TrackingNotificationsEffects` — reconcile (fires on tracking mutations) +
 *   applyNotificationCommand (the /notifications CTA deep-links here); both fire
 *   only while a tracking route is active, and dispatch into the eager
 *   notifications sink (§7)
 * - `TrackingTelemetryEffects` — pushes the item count to the eager dashboard
 *   read-model; cold-launch count comes from the persisted summary
 * - `TrackingMessageEffects` — toasts on add/update/remove/save (was the shell
 *   `AppMessageEffects`; it only listened to `TrackingActions`)
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
    TrackingSaveEffects,
    TrackingTelemetryEffects,
    TrackingNotificationsEffects,
    TrackingMessageEffects
  ),
];

/** Route hydration for the tracking slice (dispatched by the route resolver). */
export const trackingHydrationResolver = moduleHydrationResolver(
  TrackingActions.load,
  TrackingActions.loaded
);
