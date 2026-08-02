import { inject, isDevMode, provideAppInitializer } from '@angular/core';
import {
  mergeContexts,
  providePersistedContext,
} from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationService } from '../util/notification.service';
import { NotificationsInboxActions } from './notifications.actions';
import { notificationsReducer } from './notifications.reducer';
import { NotificationsDebugEffects } from './notifications-debug.effects';
import { NotificationsToastEffects } from './notifications-toast.effects';
import {
  NOTIFICATIONS_STATE_KEY,
  selectNotificationsBadgeCount,
  selectNotificationsState,
} from './notifications.selector';

export const notificationsContext = mergeContexts(
  providePersistedContext({
    key: NOTIFICATIONS_STATE_KEY,
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
  {
    providers: [
      provideAppInitializer(() => void inject(NotificationService).init()),
    ],
    resolve: {},
  }
);
