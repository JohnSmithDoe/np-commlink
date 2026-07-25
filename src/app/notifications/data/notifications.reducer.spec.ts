import { INotification } from '../../@shared/model/types';
import { NotificationsActions } from '../../@shared/data/notification/notifications.actions';
import {
  initialNotificationsState,
  notificationsReducer,
} from './notifications.reducer';

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

const withItems = (items: INotification[]) => ({
  ...initialNotificationsState,
  items,
});

describe('notificationsReducer', () => {
  it('prepends a new notification and replaces one with the same id on upsert', () => {
    const added = notificationsReducer(
      initialNotificationsState,
      NotificationsActions.addNotification(
        notification({ id: 'a', body: 'first' })
      )
    );
    expect(added.items).toHaveLength(1);

    const upserted = notificationsReducer(
      added,
      NotificationsActions.upsertNotification(
        notification({ id: 'a', body: 'second' })
      )
    );
    expect(upserted.items).toHaveLength(1);
    expect(upserted.items[0].body).toBe('second');
  });

  it('marks a notification done and back to new', () => {
    const state = withItems([notification({ id: 'a', status: 'new' })]);
    const done = notificationsReducer(
      state,
      NotificationsActions.markDone('a')
    );
    expect(done.items[0].status).toBe('done');

    const again = notificationsReducer(done, NotificationsActions.markNew('a'));
    expect(again.items[0].status).toBe('new');
  });

  it('removes a notification and clears the done ones', () => {
    const state = withItems([
      notification({ id: 'a', status: 'new' }),
      notification({ id: 'b', status: 'done' }),
    ]);
    const removed = notificationsReducer(
      state,
      NotificationsActions.removeNotification('a')
    );
    expect(removed.items.map((n) => n.id)).toEqual(['b']);

    const cleared = notificationsReducer(
      state,
      NotificationsActions.clearDone()
    );
    expect(cleared.items.map((n) => n.id)).toEqual(['a']);
  });

  it('toggles the done section and records a page view', () => {
    const toggled = notificationsReducer(
      initialNotificationsState,
      NotificationsActions.toggleDoneSection()
    );
    expect(toggled.doneCollapsed).toBe(false);

    const viewed = notificationsReducer(
      initialNotificationsState,
      NotificationsActions.markPageViewed()
    );
    expect(viewed.lastViewedAt).not.toBe(
      initialNotificationsState.lastViewedAt
    );
  });

  it('backfills updatedAt from createdAt on hydration', () => {
    const next = notificationsReducer(
      initialNotificationsState,
      NotificationsActions.loaded({
        items: [
          notification({
            id: 'a',
            updatedAt: undefined as never,
            createdAt: 'C',
          }),
        ],
        doneCollapsed: false,
        lastViewedAt: undefined as never,
      } as never)
    );
    expect(next.items[0].updatedAt).toBe('C');
    expect(next.lastViewedAt).toBe(initialNotificationsState.lastViewedAt);
  });
});
