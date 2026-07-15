import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/notifications/notifications.actions';
import {
  mockAppState,
  mockNotificationsState,
  mockTrackingItem,
  mockTrackingState,
  TEST_TIMESTAMP,
} from '../../@shared/testing/test-data';
import { INotification, IAppState } from '../../@shared/types';
import { TrackingActions } from './tracking.actions';
import { TrackingNotificationsEffects } from './tracking-notifications.effects';
import { trackingStateNotificationId } from './tracking-notifications.utils';

const OLD = '2020-01-01T00:00:00.000Z';

function mockNotification(
  overrides: Partial<INotification> = {}
): INotification {
  return {
    id: 'notif-1',
    name: 'Notice',
    createdAt: TEST_TIMESTAMP,
    body: 'body',
    icon: 'ellipse',
    color: 'medium',
    status: 'new',
    updatedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

describe('TrackingNotificationsEffects', () => {
  let effects: TrackingNotificationsEffects;

  const setup = (
    actions$: Observable<Action>,
    state: Partial<IAppState> = {}
  ) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingNotificationsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockAppState(state) }),
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    effects = TestBed.inject(TrackingNotificationsEffects);
  };

  const emissions = (source: Observable<Action>) =>
    firstValueFrom(source.pipe(toArray()));

  it('is created', () => {
    setup(of());
    expect(effects).toBeTruthy();
  });

  describe('reconcileState$', () => {
    it('upserts a state notification for the toggled (target) item', async () => {
      const item = mockTrackingItem({
        id: 't1',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      setup(of(TrackingActions.toggleTrackingItem(item, 'now')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: mockNotificationsState({ items: [] }),
      });

      const emitted = await emissions(effects.reconcileState$);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].type).toBe(
        NotificationsActions.upsertNotification.type
      );
      const { notification } = emitted[0] as ReturnType<
        typeof NotificationsActions.upsertNotification
      >;
      expect(notification.id).toBe(trackingStateNotificationId('t1'));
      // running preset
      expect(notification.icon).toBe('play-circle');
      expect(notification.color).toBe('success');
      expect(notification.action?.type).toBe('tracking.pause');
    });

    it('removes an orphaned tracking notification whose item no longer exists', async () => {
      setup(of(TrackingActions.resetAllTracking()), {
        tracking: mockTrackingState({ items: [] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({ id: trackingStateNotificationId('ghost') }),
          ],
        }),
      });

      const emitted = await emissions(effects.reconcileState$);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].type).toBe(
        NotificationsActions.removeNotification.type
      );
      expect(
        (
          emitted[0] as ReturnType<
            typeof NotificationsActions.removeNotification
          >
        ).id
      ).toBe(trackingStateNotificationId('ghost'));
    });

    it('preserves updatedAt for a cascade item whose kind did not change (no drift)', async () => {
      const target = mockTrackingItem({
        id: 'a',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      const cascade = mockTrackingItem({ id: 'b', state: 'running' });
      setup(of(TrackingActions.toggleTrackingItem(target, 'now')), {
        tracking: mockTrackingState({ items: [target, cascade] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({
              id: trackingStateNotificationId('b'),
              updatedAt: OLD,
              // previousKind(pause) === 'running' === kindForState('running')
              action: { type: 'tracking.pause', trackingItemId: 'b' },
            }),
          ],
        }),
      });

      const emitted = (await emissions(effects.reconcileState$)) as ReturnType<
        typeof NotificationsActions.upsertNotification
      >[];
      const cascadeUpsert = emitted.find(
        (a) => a.notification.id === trackingStateNotificationId('b')
      );
      expect(cascadeUpsert?.notification.updatedAt).toBe(OLD);
    });

    it('bumps updatedAt for a cascade item whose kind changed', async () => {
      const target = mockTrackingItem({
        id: 'a',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      const cascade = mockTrackingItem({ id: 'b', state: 'stopped' });
      setup(of(TrackingActions.toggleTrackingItem(target, 'now')), {
        tracking: mockTrackingState({ items: [target, cascade] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({
              id: trackingStateNotificationId('b'),
              updatedAt: OLD,
              // previousKind(pause) === 'running' !== kindForState('stopped')
              action: { type: 'tracking.pause', trackingItemId: 'b' },
            }),
          ],
        }),
      });

      const emitted = (await emissions(effects.reconcileState$)) as ReturnType<
        typeof NotificationsActions.upsertNotification
      >[];
      const cascadeUpsert = emitted.find(
        (a) => a.notification.id === trackingStateNotificationId('b')
      );
      expect(cascadeUpsert?.notification.updatedAt).not.toBe(OLD);
    });

    it('skips an untouched item (no startTime, no existing notification)', async () => {
      const item = mockTrackingItem({ id: 'u', state: 'stopped' });
      setup(of(TrackingActions.toggleTrackingItem(item, 'now')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: mockNotificationsState({ items: [] }),
      });

      expect(await emissions(effects.reconcileState$)).toEqual([]);
    });
  });

  describe('triggerAction$', () => {
    it('toggles tracking with a stopped hint for a tracking.start CTA, then marks done', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'stopped' });
      setup(of(NotificationsActions.triggerAction('n1')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({
              id: 'n1',
              action: { type: 'tracking.start', trackingItemId: 't1' },
            }),
          ],
        }),
      });

      const emitted = await emissions(effects.triggerAction$);

      expect(emitted).toHaveLength(2);
      expect(emitted[0].type).toBe(TrackingActions.toggleTrackingItem.type);
      const toggled = emitted[0] as ReturnType<
        typeof TrackingActions.toggleTrackingItem
      >;
      expect(toggled.item.id).toBe('t1');
      expect(toggled.item.state).toBe('stopped');
      expect(emitted[1].type).toBe(NotificationsActions.markDone.type);
      expect(
        (emitted[1] as ReturnType<typeof NotificationsActions.markDone>).id
      ).toBe('n1');
    });

    it('flips the hint to running for a tracking.pause CTA', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'running' });
      setup(of(NotificationsActions.triggerAction('n1')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({
              id: 'n1',
              action: { type: 'tracking.pause', trackingItemId: 't1' },
            }),
          ],
        }),
      });

      const emitted = await emissions(effects.triggerAction$);
      const toggled = emitted[0] as ReturnType<
        typeof TrackingActions.toggleTrackingItem
      >;
      expect(toggled.item.state).toBe('running');
    });

    it('only marks the notification done when the tracking item is gone', async () => {
      setup(of(NotificationsActions.triggerAction('n1')), {
        tracking: mockTrackingState({ items: [] }),
        notifications: mockNotificationsState({
          items: [
            mockNotification({
              id: 'n1',
              action: { type: 'tracking.start', trackingItemId: 'ghost' },
            }),
          ],
        }),
      });

      const emitted = await emissions(effects.triggerAction$);
      expect(emitted).toHaveLength(1);
      expect(emitted[0].type).toBe(NotificationsActions.markDone.type);
    });

    it('emits nothing when the notification has no action', async () => {
      setup(of(NotificationsActions.triggerAction('n1')), {
        notifications: mockNotificationsState({
          items: [mockNotification({ id: 'n1', action: undefined })],
        }),
      });

      expect(await emissions(effects.triggerAction$)).toEqual([]);
    });
  });

  describe('addDebugNotification$', () => {
    it('creates a notification referencing the only tracking item', async () => {
      const item = mockTrackingItem({ id: 't1', name: 'Ticket' });
      setup(of(NotificationsActions.addDebugNotification()), {
        tracking: mockTrackingState({ items: [item] }),
      });

      const emitted = await firstValueFrom(effects.addDebugNotification$);
      expect(emitted.type).toBe(NotificationsActions.addNotification.type);
      const { notification } = emitted as ReturnType<
        typeof NotificationsActions.addNotification
      >;
      expect(notification.status).toBe('new');
      expect(notification.trackingItemId).toBe('t1');
      expect(notification.action?.trackingItemId).toBe('t1');
      expect(['tracking.start', 'tracking.stop', 'tracking.pause']).toContain(
        notification.action?.type
      );
    });
  });

  describe('runningUpdates$', () => {
    it('emits a body update per running item on each interval tick', async () => {
      const running = mockTrackingItem({
        id: 'r1',
        name: 'Ticket',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      setup(of(TrackingActions.loaded(null)), {
        tracking: mockTrackingState({ items: [running] }),
      });

      vi.useFakeTimers();
      try {
        const pending = firstValueFrom(effects.runningUpdates$);
        vi.advanceTimersByTime(60_000);
        const emitted = await pending;
        expect(emitted.type).toBe(
          NotificationsActions.updateNotificationBody.type
        );
        expect(
          (
            emitted as ReturnType<
              typeof NotificationsActions.updateNotificationBody
            >
          ).id
        ).toBe(trackingStateNotificationId('r1'));
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
