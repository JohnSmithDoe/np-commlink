import {
  NotificationsState,
  InboxNotification,
  ProjectedNotification,
} from '../../@shared/model/notifications.types';

export const upsertNotification = (
  items: InboxNotification[],
  next: InboxNotification
): InboxNotification[] => {
  const index = items.findIndex((n) => n.id === next.id);
  if (index === -1) return [next, ...items];
  const out = [...items];
  out[index] = next;
  return out;
};

export const projectOwnedNotifications = (
  items: InboxNotification[],
  owner: string,
  projected: ProjectedNotification[],
  now: string
): InboxNotification[] => {
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
  { variant, ...content }: ProjectedNotification,
  existing: InboxNotification | undefined,
  owner: string,
  now: string
): InboxNotification => ({
  ...content,
  origin: { owner, variant },
  status: statusFor(variant, existing),
  createdAt: existing?.createdAt ?? now,
  updatedAt: content.updatedAt ?? touchedAt(variant, existing, now),
});

const statusFor = (
  variant: string,
  existing: InboxNotification | undefined
): InboxNotification['status'] =>
  existing?.origin?.variant === variant ? existing.status : 'open';

const touchedAt = (
  variant: string,
  existing: InboxNotification | undefined,
  now: string
): string => (existing?.origin?.variant === variant ? existing.updatedAt : now);

const patchNotificationById = (
  items: InboxNotification[],
  id: string,
  patch: (n: InboxNotification) => InboxNotification
): InboxNotification[] => items.map((n) => (n.id === id ? patch(n) : n));

export const markNotificationDone = (
  items: InboxNotification[],
  id: string,
  now: string
): InboxNotification[] =>
  patchNotificationById(items, id, (n) => ({
    ...n,
    status: 'done',
    updatedAt: now,
  }));

export const removeNotificationById = (
  items: InboxNotification[],
  id: string
): InboxNotification[] => items.filter((n) => n.id !== id);

export const clearDoneNotifications = (
  items: InboxNotification[]
): InboxNotification[] => items.filter((n) => n.status !== 'done');

const isUnread = (
  notification: InboxNotification,
  lastViewedAt: string
): boolean =>
  notification.status === 'open' && notification.updatedAt > lastViewedAt;

export const unreadCount = (state: NotificationsState): number =>
  state.items.filter((notification) =>
    isUnread(notification, state.lastViewedAt)
  ).length;
