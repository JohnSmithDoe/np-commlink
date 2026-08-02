import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNotificationsBadgeCount,
  selectOpenNotifications,
} from './notifications.selector';
import {
  NotificationsState,
  InboxNotification,
} from '../../@shared/model/notifications.types';

const notification = (
  over: Partial<InboxNotification> = {}
): InboxNotification => ({
  id: '1',
  name: 'Notification',
  createdAt: '2026-06-01T08:00:00.000Z',
  body: 'body',
  icon: 'alarm',
  color: 'primary',
  status: 'open',
  updatedAt: '2026-06-01T08:00:00.000Z',
  ...over,
});

const state = (over: Partial<NotificationsState> = {}): NotificationsState => ({
  items: [],
  doneCollapsed: true,
  lastViewedAt: '2026-07-03T00:00:00.000Z',
  ...over,
});

describe('notifications.selector', () => {
  const items = [
    notification({
      id: 'n1',
      status: 'open',
      updatedAt: '2026-07-05T00:00:00.000Z',
    }),
    notification({
      id: 'n2',
      status: 'open',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }),
    notification({
      id: 'd1',
      status: 'done',
      updatedAt: '2026-07-10T00:00:00.000Z',
    }),
  ];

  it('returns new notifications, newest first', () => {
    expect(
      selectOpenNotifications.projector(state({ items })).map((n) => n.id)
    ).toEqual(['n1', 'n2']);
  });

  it('returns done notifications', () => {
    expect(
      selectDoneNotifications.projector(state({ items })).map((n) => n.id)
    ).toEqual(['d1']);
  });

  it('exposes the done-collapsed flag', () => {
    expect(selectDoneCollapsed.projector(state({ doneCollapsed: false }))).toBe(
      false
    );
  });

  it('counts only new notifications updated since the last view', () => {
    expect(selectNotificationsBadgeCount.projector(state({ items }))).toBe(1);
  });
});
