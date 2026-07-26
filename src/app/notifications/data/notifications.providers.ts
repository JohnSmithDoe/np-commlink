import { inject, isDevMode, provideAppInitializer } from '@angular/core';
import {
  mergeContexts,
  providePersistedContext,
} from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationService } from '../util/notification.service';
import { NotificationsInboxActions } from './actions/notifications.actions';
import { notificationsReducer } from './reducer/notifications.reducer';
import { NotificationsDebugEffects } from './effects/notifications-debug.effects';
import { NotificationsToastEffects } from './effects/notifications-toast.effects';
import {
  selectNotificationsBadgeCount,
  selectNotificationsState,
} from './selectors/notifications.selector';

/**
 * The notifications inbox — EAGER, composed by `provideAppKernel()` into the
 * root injector rather than registered on a route.
 *
 * Eager because the inbox is a **fan-in sink**: every module publishes into it
 * from its own route, and the shell badge reads it on every screen. A slice like
 * that cannot be scoped to one producer's route lifecycle — the same argument
 * that keeps commlink's dashboard read-model eager. Routing it cost more than it
 * saved: a producer had to write the persisted doc behind the reducer's back
 * through a durable port, leaving two write paths that had to be kept provably
 * identical. Now a producer dispatches `NotificationsActions` and this reducer is
 * always there to receive it. (`/notifications` is still a lazy *page* — that is
 * `loadComponent`, independent of where the slice lives.)
 *
 * Every write lands on the save trigger, producers' included, so a producer stays
 * ignorant that notifications are persisted at all.
 *
 * `NotificationsToastEffects` rides here even though it touches no slice: a toast
 * can be raised from any route including the eager boot path (storage
 * unavailable), so the presenter has to exist before any producer does. The
 * OS-level office reminder rides along too — it must be (re)scheduled on every
 * launch, and an eager slice gives the domain one boot entry point, so the shell
 * never reaches into `notifications/util` itself.
 */
export const notificationsContext = mergeContexts(
  providePersistedContext({
    key: 'notifications',
    reducer: notificationsReducer,
    lifecycle: NotificationsInboxActions,
    select: selectNotificationsState,
    save: {
      on: [
        NotificationsActions.notify,
        NotificationsActions.project,
        NotificationsActions.dismiss,
        NotificationsActions.remove,
        NotificationsInboxActions.clearDone,
        NotificationsInboxActions.toggleDoneSection,
        NotificationsInboxActions.markPageViewed,
      ],
    },
    telemetry: [
      {
        source: 'notifications',
        select: selectNotificationsBadgeCount,
        metrics: createMetric('unread'),
      },
    ],
    hydrate: 'boot',
    effects: [
      ...(isDevMode() ? [NotificationsDebugEffects] : []),
      NotificationsToastEffects,
    ],
  }),
  // The OS-level office reminder must be (re)scheduled on every launch, and the
  // domain's own bundle is the one boot entry point the shell can compose without
  // reaching into `notifications/util` itself.
  {
    providers: [
      provideAppInitializer(() => void inject(NotificationService).init()),
    ],
    resolve: {},
  }
);
