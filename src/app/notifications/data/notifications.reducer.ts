import { createReducer, on } from '@ngrx/store';
import dayjs from 'dayjs';
import { INotificationsState } from '../../@shared/model/types';
import { NotificationsActions } from '../../@shared/data/notification/notifications.actions';
import {
  clearDoneNotifications,
  EMPTY_NOTIFICATIONS_STATE,
  markNotificationDone,
  markNotificationNew,
  removeNotificationById,
  upsertNotification,
} from '../../@shared/util/notifications/notifications.transforms';

// The empty baseline (epoch lastViewedAt) is shared with the durable
// NotificationsStore fallback so the on-route reducer and off-route writer can't
// drift (§7).
export const initialNotificationsState: INotificationsState =
  EMPTY_NOTIFICATIONS_STATE;

// The list mutations delegate to the shared pure transforms
// (notifications.transforms) so the off-route durable writer applies identical
// logic once notifications is lazy (§7).
export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(
    NotificationsActions.addNotification,
    (state, { notification }): INotificationsState => ({
      ...state,
      items: upsertNotification(state.items, notification),
    })
  ),
  on(
    NotificationsActions.upsertNotification,
    (state, { notification }): INotificationsState => ({
      ...state,
      items: upsertNotification(state.items, notification),
    })
  ),
  on(NotificationsActions.markDone, (state, { id }): INotificationsState => ({
    ...state,
    items: markNotificationDone(state.items, id, dayjs().format()),
  })),
  on(NotificationsActions.markNew, (state, { id }): INotificationsState => ({
    ...state,
    items: markNotificationNew(state.items, id, dayjs().format()),
  })),
  on(
    NotificationsActions.removeNotification,
    (state, { id }): INotificationsState => ({
      ...state,
      items: removeNotificationById(state.items, id),
    })
  ),
  on(NotificationsActions.clearDone, (state): INotificationsState => ({
    ...state,
    items: clearDoneNotifications(state.items),
  })),
  on(NotificationsActions.toggleDoneSection, (state): INotificationsState => ({
    ...state,
    doneCollapsed: !state.doneCollapsed,
  })),
  on(NotificationsActions.markPageViewed, (state): INotificationsState => ({
    ...state,
    lastViewedAt: dayjs().format(),
  })),
  on(
    NotificationsActions.loaded,
    (state, { notifications }): INotificationsState => {
      const loaded = notifications;
      if (!loaded) return state;
      // Defensive backfill: notifications persisted before updatedAt /
      // lastViewedAt existed.
      return {
        ...loaded,
        items: loaded.items.map((n) => ({
          ...n,
          updatedAt: n.updatedAt ?? n.createdAt,
        })),
        lastViewedAt:
          loaded.lastViewedAt ?? initialNotificationsState.lastViewedAt,
      };
    }
  )
);
