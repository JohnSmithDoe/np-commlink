import { createReducer, on } from '@ngrx/store';
import dayjs from 'dayjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from '../actions/notifications.actions';
import {
  clearDoneNotifications,
  markNotificationDone,
  projectOwnedNotifications,
  removeNotificationById,
  upsertNotification,
} from '../../util/notifications.transforms';
import { INotificationsState } from '../../../@shared/model/notifications.types';

// Epoch lastViewedAt → any real notification counts as unread until the page is
// first opened.
export const initialNotificationsState: INotificationsState = {
  items: [],
  doneCollapsed: true,
  lastViewedAt: '1970-01-01T00:00:00.000Z',
};

export const notificationsReducer = createReducer(
  initialNotificationsState,
  // The published producer contract (@shared) — dispatched from any route by any
  // module, plus by the inbox page itself for the two ops it shares.
  on(
    NotificationsActions.notify,
    (state, { notification }): INotificationsState => ({
      ...state,
      items: upsertNotification(state.items, notification),
    })
  ),
  on(
    NotificationsActions.project,
    (state, { owner, notifications }): INotificationsState => ({
      ...state,
      items: projectOwnedNotifications(
        state.items,
        owner,
        notifications,
        dayjs().format()
      ),
    })
  ),
  on(NotificationsActions.dismiss, (state, { id }): INotificationsState => ({
    ...state,
    items: markNotificationDone(state.items, id, dayjs().format()),
  })),
  on(NotificationsActions.remove, (state, { id }): INotificationsState => ({
    ...state,
    items: removeNotificationById(state.items, id),
  })),
  on(NotificationsInboxActions.clearDone, (state): INotificationsState => ({
    ...state,
    items: clearDoneNotifications(state.items),
  })),
  on(
    NotificationsInboxActions.toggleDoneSection,
    (state): INotificationsState => ({
      ...state,
      doneCollapsed: !state.doneCollapsed,
    })
  ),
  on(
    NotificationsInboxActions.markPageViewed,
    (state): INotificationsState => ({
      ...state,
      lastViewedAt: dayjs().format(),
    })
  ),
  on(
    NotificationsInboxActions.loaded,
    (state, { notifications }): INotificationsState => notifications ?? state
  )
);
