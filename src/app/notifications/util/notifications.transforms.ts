import {
  INotification,
  INotificationsState,
  TProjectedNotification,
} from '../../@shared/model/notifications.types';

/**
 * Pure notification-list transforms — no dayjs, no store: callers pass `now`
 * so these stay pure and testable.
 */

// Replace by id, else prepend. Array order is irrelevant — consumers sort by
// updatedAt — so no positional logic lives here.
export const upsertNotification = (
  items: INotification[],
  next: INotification
): INotification[] => {
  const index = items.findIndex((n) => n.id === next.id);
  if (index === -1) return [next, ...items];
  const out = [...items];
  out[index] = next;
  return out;
};

/**
 * Apply a producer's complete set of rows: whatever it projects replaces
 * whatever it published before, and rows it stopped projecting are gone.
 *
 * `updatedAt` is the inbox's, not the producer's — a row keeps it for as long as
 * the producer keeps reporting the same `variant`, so re-projecting a list only
 * reorders what genuinely changed and a producer's cascade doesn't drag unrelated
 * rows to the top. A producer that wants a row surfaced anyway (the one the user
 * just acted on) stamps `updatedAt` itself. `createdAt` never moves once set.
 */
export const projectOwnedNotifications = (
  items: INotification[],
  owner: string,
  projected: TProjectedNotification[],
  now: string
): INotification[] => {
  const claimed = new Set(projected.map((next) => next.id));
  return [
    ...projected.map((next) =>
      stampProjected(
        next,
        items.find((item) => item.id === next.id),
        owner,
        now
      )
    ),
    ...items.filter(
      (item) => item.origin?.owner !== owner && !claimed.has(item.id)
    ),
  ];
};

const stampProjected = (
  { variant, ...content }: TProjectedNotification,
  existing: INotification | undefined,
  owner: string,
  now: string
): INotification => ({
  ...content,
  origin: { owner, variant },
  status: statusFor(variant, existing),
  createdAt: existing?.createdAt ?? now,
  updatedAt: content.updatedAt ?? touchedAt(variant, existing, now),
});

// Dismissal survives a re-projection of the same variant — otherwise tapping
// "Erledigt" is undone by the owner's very next mutation. A changed variant is
// a materially different message, so it comes back as unread.
const statusFor = (
  variant: string,
  existing: INotification | undefined
): INotification['status'] =>
  existing?.origin?.variant === variant ? existing.status : 'new';

const touchedAt = (
  variant: string,
  existing: INotification | undefined,
  now: string
): string => (existing?.origin?.variant === variant ? existing.updatedAt : now);

const patchNotificationById = (
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

export const removeNotificationById = (
  items: INotification[],
  id: string
): INotification[] => items.filter((n) => n.id !== id);

export const clearDoneNotifications = (
  items: INotification[]
): INotification[] => items.filter((n) => n.status !== 'done');

const isUnread = (notification: INotification, lastViewedAt: string): boolean =>
  notification.status === 'new' && notification.updatedAt > lastViewedAt;

// The single source of truth for the badge metric.
export const unreadCount = (state: INotificationsState): number =>
  state.items.filter((notification) =>
    isUnread(notification, state.lastViewedAt)
  ).length;
