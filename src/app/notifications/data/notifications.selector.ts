import { createFeatureSelector, createSelector } from '@ngrx/store';
import { INotification, INotificationsState } from '../../@shared/model/types';
import { unreadCount } from '../../@shared/util/notifications/notifications.transforms';

export const selectNotificationsState =
  createFeatureSelector<INotificationsState>('notifications');

const byUpdatedAtDesc = (a: INotification, b: INotification): number =>
  b.updatedAt.localeCompare(a.updatedAt);

export const selectNewNotifications = createSelector(
  selectNotificationsState,
  (state): INotification[] =>
    state.items.filter((n) => n.status === 'new').toSorted(byUpdatedAtDesc)
);

export const selectDoneNotifications = createSelector(
  selectNotificationsState,
  (state): INotification[] =>
    state.items.filter((n) => n.status === 'done').toSorted(byUpdatedAtDesc)
);

export const selectDoneCollapsed = createSelector(
  selectNotificationsState,
  (state): boolean => state.doneCollapsed
);

// Unread = status 'new' and updated since the user last opened the page.
// Each notification's updatedAt represents its latest touch, so multiple
// updates between views collapse to a single unread tally naturally.
export const selectNotificationsBadgeCount = createSelector(
  selectNotificationsState,
  unreadCount
);
