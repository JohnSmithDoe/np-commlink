import { createFeatureSelector, createSelector } from '@ngrx/store';
import { unreadCount } from '../util/notifications.transforms';
import {
  NotificationsState,
  InboxNotification,
} from '../../@shared/model/notifications.types';

export const NOTIFICATIONS_STATE_KEY = 'notifications';

export const selectNotificationsState =
  createFeatureSelector<NotificationsState>(NOTIFICATIONS_STATE_KEY);

const byUpdatedAtDesc = (a: InboxNotification, b: InboxNotification): number =>
  b.updatedAt.localeCompare(a.updatedAt);

export const selectOpenNotifications = createSelector(
  selectNotificationsState,
  (state): InboxNotification[] =>
    state.items.filter((n) => n.status === 'open').toSorted(byUpdatedAtDesc)
);

export const selectDoneNotifications = createSelector(
  selectNotificationsState,
  (state): InboxNotification[] =>
    state.items.filter((n) => n.status === 'done').toSorted(byUpdatedAtDesc)
);

export const selectDoneCollapsed = createSelector(
  selectNotificationsState,
  (state): boolean => state.doneCollapsed
);

export const selectLegacyCronsCleared = createSelector(
  selectNotificationsState,
  (state): boolean => state.legacyCronsCleared === true
);

export const selectNotificationsBadgeCount = createSelector(
  selectNotificationsState,
  unreadCount
);
