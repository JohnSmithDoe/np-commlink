import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { NotificationsActions } from '../../@shared/data/notification/notifications.actions';
import { notificationsReducer } from './notifications.reducer';
import { NotificationsLoadEffects } from './effects/notifications-load.effects';
import { NotificationsSaveEffects } from './effects/notifications-save.effects';
import { NotificationsTelemetryEffects } from './effects/notifications-telemetry.effects';
import { NotificationsDebugEffects } from './effects/notifications-debug.effects';

/**
 * Lazy state + effects for `notifications`, registered on the `/notifications`
 * route and hydrated by `moduleHydrationResolver(NotificationsActions.load,
 * .loaded)` (lazy-modules §7). notifications is no longer an eager capability
 * sink: its OWN list is edited only on this route (reducer + save), and the
 * off-route cross-module writer (tracking's reconcile/CTA) writes the durable
 * `npc-notifications` doc via NotificationsStore instead of dispatching into the
 * reducer. The telemetry reporter rides here so its `store.select` never reads
 * an unregistered slice; while notifications is unloaded the badge read-model is
 * kept live by NotificationsStore's report on each durable write, and the
 * cold-launch count comes from the persisted `npc-summary-notifications`.
 */
export const notificationsLazyProviders: Array<
  Provider | EnvironmentProviders
> = [
  provideState('notifications', notificationsReducer),
  provideEffects(
    NotificationsLoadEffects,
    NotificationsSaveEffects,
    NotificationsTelemetryEffects,
    NotificationsDebugEffects
  ),
];

/** Route hydration for the notifications slice (dispatched by the route resolver). */
export const notificationsHydrationResolver = moduleHydrationResolver(
  NotificationsActions.load,
  NotificationsActions.loaded
);
