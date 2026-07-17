import { INotification, INotificationsState } from '../../types';

/**
 * Pure notification-list transforms, shared by the notifications reducer (the
 * on-route in-memory path) and the durable notifications store (the off-route
 * write path used by tracking once notifications is lazy — lazy-modules §7).
 * Both must apply IDENTICAL logic, so it lives here once. No dayjs/no store:
 * callers pass `now` so the functions stay pure and testable.
 */

// Epoch lastViewedAt → any real notification counts as unread until the page is
// first opened. The single empty baseline for both the reducer's initialState
// and the durable store's "no doc yet" fallback (so they can't drift).
export const EMPTY_NOTIFICATIONS_STATE: INotificationsState = {
  items: [],
  doneCollapsed: true,
  lastViewedAt: '1970-01-01T00:00:00.000Z',
};

// Replace by id, else prepend. Array order is irrelevant — consumers sort by
// updatedAt — so no positional logic lives here.
export const upsertNotification = (
  items: INotification[],
  next: INotification
): INotification[] => {
  const idx = items.findIndex((n) => n.id === next.id);
  if (idx < 0) return [next, ...items];
  const out = [...items];
  out[idx] = next;
  return out;
};

export const patchNotificationById = (
  items: INotification[],
  id: string,
  patch: (n: INotification) => INotification
): INotification[] => items.map((n) => (n.id === id ? patch(n) : n));

export const markNotificationDone = (
  items: INotification[],
  id: string,
  now: string
): INotification[] =>
  patchNotificationById(items, id, (n) => ({
    ...n,
    status: 'done',
    updatedAt: now,
  }));

export const markNotificationNew = (
  items: INotification[],
  id: string,
  now: string
): INotification[] =>
  patchNotificationById(items, id, (n) => ({
    ...n,
    status: 'new',
    updatedAt: now,
  }));

export const removeNotificationById = (
  items: INotification[],
  id: string
): INotification[] => items.filter((n) => n.id !== id);

export const clearDoneNotifications = (
  items: INotification[]
): INotification[] => items.filter((n) => n.status !== 'done');

// Count unread = status 'new' and touched since the user last opened the page.
// The single source of truth for the badge metric, so the on-route reporter and
// the off-route durable writer report the same number.
export const unreadCount = (state: INotificationsState): number =>
  state.items.filter(
    (n) => n.status === 'new' && n.updatedAt > state.lastViewedAt
  ).length;
