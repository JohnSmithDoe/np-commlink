import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import {
  initialNotificationsState,
  notificationsReducer,
} from './notifications.reducer';
import {
  InboxNotification,
  ProjectedNotification,
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

const withItems = (items: InboxNotification[]) => ({
  ...initialNotificationsState,
  items,
});

const projected = (
  over: Partial<ProjectedNotification> = {}
): ProjectedNotification => ({
  id: '1',
  name: 'Notification',
  body: 'body',
  icon: 'alarm',
  color: 'primary',
  variant: 'running',
  ...over,
});

describe('notificationsReducer', () => {
  it('prepends a published notification and replaces one with the same id', () => {
    const added = notificationsReducer(
      initialNotificationsState,
      NotificationsActions.notify(notification({ id: 'a', body: 'first' }))
    );
    expect(added.items).toHaveLength(1);

    const upserted = notificationsReducer(
      added,
      NotificationsActions.notify(notification({ id: 'a', body: 'second' }))
    );
    expect(upserted.items).toHaveLength(1);
    expect(upserted.items[0].body).toBe('second');
  });

  describe('project', () => {
    it('replaces the owner rows and drops the ones no longer projected', () => {
      const state = withItems([
        notification({
          id: 'a',
          body: 'stale',
          origin: { owner: 'tracking', variant: 'running' },
        }),
        notification({
          id: 'gone',
          origin: { owner: 'tracking', variant: 'stopped' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', body: 'fresh' }),
        ])
      );

      expect(next.items.map((n) => n.id)).toEqual(['a']);
      expect(next.items[0].body).toBe('fresh');
    });

    it('leaves rows another owner published alone', () => {
      const state = withItems([
        notification({ id: 'debug-1' }),
        notification({ id: 'b', origin: { owner: 'cash', variant: 'due' } }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [])
      );

      expect(next.items.map((n) => n.id)).toEqual(['debug-1', 'b']);
    });

    it('keeps updatedAt and createdAt while the variant is unchanged', () => {
      const state = withItems([
        notification({
          id: 'a',
          createdAt: 'C',
          updatedAt: 'OLD',
          origin: { owner: 'tracking', variant: 'running' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', body: 'ticked over' }),
        ])
      );

      expect(next.items[0].updatedAt).toBe('OLD');
      expect(next.items[0].createdAt).toBe('C');
    });

    it('stamps updatedAt when the variant changed', () => {
      const state = withItems([
        notification({
          id: 'a',
          updatedAt: 'OLD',
          origin: { owner: 'tracking', variant: 'running' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', variant: 'paused' }),
        ])
      );

      expect(next.items[0].updatedAt).not.toBe('OLD');
    });

    it('honours an updatedAt the producer stamped itself', () => {
      const state = withItems([
        notification({
          id: 'a',
          updatedAt: 'OLD',
          origin: { owner: 'tracking', variant: 'running' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', updatedAt: 'NOW' }),
        ])
      );

      expect(next.items[0].updatedAt).toBe('NOW');
    });

    it('keeps a dismissed row done when the same variant is re-projected', () => {
      const state = withItems([
        notification({
          id: 'a',
          status: 'done',
          origin: { owner: 'tracking', variant: 'running' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', variant: 'running' }),
        ])
      );

      expect(next.items[0].status).toBe('done');
    });

    it('brings a dismissed row back as new when its variant changes', () => {
      const state = withItems([
        notification({
          id: 'a',
          status: 'done',
          origin: { owner: 'tracking', variant: 'running' },
        }),
      ]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [
          projected({ id: 'a', variant: 'paused' }),
        ])
      );

      expect(next.items[0].status).toBe('open');
    });

    it('replaces a same-id row that carries no origin', () => {
      const state = withItems([notification({ id: 'a', origin: undefined })]);

      const next = notificationsReducer(
        state,
        NotificationsActions.project('tracking', [projected({ id: 'a' })])
      );

      expect(next.items).toHaveLength(1);
      expect(next.items[0].origin?.owner).toBe('tracking');
    });
  });

  it('marks a notification done on dismiss', () => {
    const state = withItems([notification({ id: 'a', status: 'open' })]);
    const done = notificationsReducer(state, NotificationsActions.dismiss('a'));
    expect(done.items[0].status).toBe('done');
  });

  it('stamps the time the action carries, not the time it runs', () => {
    const at = '2026-08-01T12:00:00.000Z';
    const state = withItems([notification({ id: 'a', status: 'open' })]);

    expect(
      notificationsReducer(state, NotificationsActions.dismiss('a', at))
        .items[0].updatedAt
    ).toBe(at);
    expect(
      notificationsReducer(state, NotificationsInboxActions.markPageViewed(at))
        .lastViewedAt
    ).toBe(at);
    expect(
      notificationsReducer(
        withItems([]),
        NotificationsActions.project('tracking', [projected({ id: 'a' })], at)
      ).items[0].createdAt
    ).toBe(at);
  });

  it('removes a notification and clears the done ones', () => {
    const state = withItems([
      notification({ id: 'a', status: 'open' }),
      notification({ id: 'b', status: 'done' }),
    ]);
    const removed = notificationsReducer(
      state,
      NotificationsActions.remove('a')
    );
    expect(removed.items.map((n) => n.id)).toEqual(['b']);

    const cleared = notificationsReducer(
      state,
      NotificationsInboxActions.clearDone()
    );
    expect(cleared.items.map((n) => n.id)).toEqual(['a']);
  });

  it('toggles the done section and records a page view', () => {
    const toggled = notificationsReducer(
      initialNotificationsState,
      NotificationsInboxActions.toggleDoneSection()
    );
    expect(toggled.doneCollapsed).toBe(false);

    const viewed = notificationsReducer(
      initialNotificationsState,
      NotificationsInboxActions.markPageViewed()
    );
    expect(viewed.lastViewedAt).not.toBe(
      initialNotificationsState.lastViewedAt
    );
  });
});
