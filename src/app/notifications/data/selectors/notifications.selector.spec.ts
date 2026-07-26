import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNewNotifications,
  selectNotificationsBadgeCount,
} from './notifications.selector';
import {
  INotification,
  INotificationsState,
} from '../../../@shared/model/notifications.types';

const notification = (over: Partial<INotification> = {}): INotification => ({
  id: '1',
  name: 'Notification',
  createdAt: '2026-06-01T08:00:00.000Z',
  body: 'body',
  icon: 'alarm',
  color: 'primary',
  status: 'new',
  updatedAt: '2026-06-01T08:00:00.000Z',
  ...over,
});

const state = (
  over: Partial<INotificationsState> = {}
): INotificationsState => ({
  items: [],
  doneCollapsed: true,
  lastViewedAt: '2026-07-03T00:00:00.000Z',
  ...over,
});

describe('notifications.selector', () => {
  const items = [
    notification({
      id: 'n1',
      status: 'new',
      updatedAt: '2026-07-05T00:00:00.000Z',
    }),
    notification({
      id: 'n2',
      status: 'new',
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
      selectNewNotifications.projector(state({ items })).map((n) => n.id)
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
    // n1 (07-05) is after lastViewedAt (07-03); n2 (07-01) is not.
    expect(selectNotificationsBadgeCount.projector(state({ items }))).toBe(1);
  });
});
