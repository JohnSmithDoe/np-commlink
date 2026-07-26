import { createFeatureSelector, createSelector } from '@ngrx/store';
import { unreadCount } from '../../util/notifications.transforms';
import {
  INotification,
  INotificationsState,
} from '../../../@shared/model/notifications.types';

// The inbox's own root selector. It is a module internal, not part of the
// published contract: producers write the slice (NotificationsActions) and never
// read it, so nothing outside this folder needs the raw state — which is what
// keeps the notifications feature key out of @shared.
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
