import { createReducer, on } from '@ngrx/store';
import dayjs from 'dayjs';
import { INotification, INotificationsState } from '../../@shared/types';
import { applicationActions } from '../../@shared/data/application.actions';
import { notificationsActions } from './notifications.actions';

// Epoch initial value: never been viewed, so any updatedAt > epoch counts
// as unread for badge purposes. Overwritten the first time the page opens.
export const initialNotificationsState: INotificationsState = {
  items: [],
  doneCollapsed: true,
  lastViewedAt: '1970-01-01T00:00:00.000Z',
};

// Replace by id, else prepend. Ordering in the array is irrelevant —
// selectors sort by updatedAt — so no positional logic lives here.
const upsert = (
  items: INotification[],
  next: INotification
): INotification[] => {
  const idx = items.findIndex((n) => n.id === next.id);
  if (idx < 0) return [next, ...items];
  const out = [...items];
  out[idx] = next;
  return out;
};

const patchById = (
  items: INotification[],
  id: string,
  patch: (n: INotification) => INotification
): INotification[] => items.map((n) => (n.id === id ? patch(n) : n));

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(
    notificationsActions.addNotification,
    (state, { notification }): INotificationsState => ({
      ...state,
      items: upsert(state.items, notification),
    })
  ),
  on(
    notificationsActions.upsertNotification,
    (state, { notification }): INotificationsState => ({
      ...state,
      items: upsert(state.items, notification),
    })
  ),
  on(
    notificationsActions.updateNotificationBody,
    (state, { id, body }): INotificationsState => ({
      ...state,
      // Body refresh from the periodic tick — deliberately does NOT touch
      // updatedAt, so running items don't drift to the top every minute.
      items: patchById(state.items, id, (n) => ({ ...n, body })),
    })
  ),
  on(notificationsActions.markDone, (state, { id }): INotificationsState => ({
    ...state,
    items: patchById(state.items, id, (n) => ({
      ...n,
      status: 'done',
      updatedAt: dayjs().format(),
    })),
  })),
  on(notificationsActions.markNew, (state, { id }): INotificationsState => ({
    ...state,
    items: patchById(state.items, id, (n) => ({
      ...n,
      status: 'new',
      updatedAt: dayjs().format(),
    })),
  })),
  on(
    notificationsActions.removeNotification,
    (state, { id }): INotificationsState => ({
      ...state,
      items: state.items.filter((n) => n.id !== id),
    })
  ),
  on(notificationsActions.clearDone, (state): INotificationsState => ({
    ...state,
    items: state.items.filter((n) => n.status !== 'done'),
  })),
  on(notificationsActions.toggleDoneSection, (state): INotificationsState => ({
    ...state,
    doneCollapsed: !state.doneCollapsed,
  })),
  on(notificationsActions.markPageViewed, (state): INotificationsState => ({
    ...state,
    lastViewedAt: dayjs().format(),
  })),
  on(
    applicationActions.loadedSuccessfully,
    (state, { datastore }): INotificationsState => {
      const loaded = datastore.notifications;
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
