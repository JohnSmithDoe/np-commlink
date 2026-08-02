import { createReducer, on } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import {
  clearDoneNotifications,
  markNotificationDone,
  projectOwnedNotifications,
  removeNotificationById,
  upsertNotification,
} from '../util/notifications.transforms';
import { NotificationsState } from '../../@shared/model/notifications.types';

export const initialNotificationsState: NotificationsState = {
  items: [],
  doneCollapsed: true,
  lastViewedAt: '1970-01-01T00:00:00.000Z',
};

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(
    NotificationsActions.notify,
    (state, { notification }): NotificationsState => ({
      ...state,
      items: upsertNotification(state.items, notification),
    })
  ),
  on(
    NotificationsActions.project,
    (state, { owner, notifications, at }): NotificationsState => ({
      ...state,
      items: projectOwnedNotifications(state.items, owner, notifications, at),
    })
  ),
  on(NotificationsActions.dismiss, (state, { id, at }): NotificationsState => ({
    ...state,
    items: markNotificationDone(state.items, id, at),
  })),
  on(NotificationsActions.remove, (state, { id }): NotificationsState => ({
    ...state,
    items: removeNotificationById(state.items, id),
  })),
  on(NotificationsInboxActions.clearDone, (state): NotificationsState => ({
    ...state,
    items: clearDoneNotifications(state.items),
  })),
  on(
    NotificationsInboxActions.toggleDoneSection,
    (state): NotificationsState => ({
      ...state,
      doneCollapsed: !state.doneCollapsed,
    })
  ),
  on(
    NotificationsInboxActions.markPageViewed,
    (state, { at }): NotificationsState => ({
      ...state,
      lastViewedAt: at,
    })
  ),
  on(
    NotificationsInboxActions.loaded,
    (state, { notifications }): NotificationsState => notifications ?? state
  )
);
