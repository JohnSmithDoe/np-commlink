import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsStore } from '../../@shared/util/notifications/notifications.store';
import {
  mockAppState,
  mockTrackingItem,
  mockTrackingState,
  TEST_TIMESTAMP,
} from '../../@shared/testing/test-data';
import {
  INotification,
  INotificationsState,
  IAppState,
} from '../../@shared/types';
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

const notifState = (items: INotification[]): INotificationsState => ({
  items,
  doneCollapsed: true,
  lastViewedAt: '1970-01-01T00:00:00.000Z',
});

describe('TrackingNotificationsEffects', () => {
  let effects: TrackingNotificationsEffects;
  // Fake durable notifications store: `mutate` applies the transform to the
  // held state (mirroring read-modify-write), `read` returns it.
  let stored: INotificationsState;
  let store: {
    read: ReturnType<typeof vi.fn>;
    mutate: ReturnType<typeof vi.fn>;
  };

  const setup = (
    actions$: Observable<Action>,
    opts: {
      tracking?: IAppState['tracking'];
      notifications?: INotification[];
    } = {}
  ) => {
    stored = notifState(opts.notifications ?? []);
    store = {
      read: vi.fn(async () => stored),
      mutate: vi.fn(
        async (t: (s: INotificationsState) => INotificationsState) => {
          stored = t(stored);
        }
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        TrackingNotificationsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockAppState({
            tracking: opts.tracking ?? mockTrackingState({ items: [] }),
          }),
        }),
        { provide: NotificationsStore, useValue: store },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    effects = TestBed.inject(TrackingNotificationsEffects);
  };

  const emissions = <T>(source: Observable<T>): Promise<T[]> =>
    firstValueFrom(source.pipe(toArray()));

  it('is created', () => {
    setup(of());
    expect(effects).toBeTruthy();
  });

  describe('reconcileState$ (durable)', () => {
    it('upserts a running state notification for the toggled item', async () => {
      const item = mockTrackingItem({
        id: 't1',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      setup(of(TrackingActions.toggleTrackingItem(item, 'now')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: [],
      });

      await emissions(effects.reconcileState$);

      expect(store.mutate).toHaveBeenCalled();
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].id).toBe(trackingStateNotificationId('t1'));
      expect(stored.items[0].icon).toBe('play-circle');
      expect(stored.items[0].action?.type).toBe('tracking.pause');
    });

    it('removes an orphaned tracking notification whose item is gone', async () => {
      setup(of(TrackingActions.resetAllTracking()), {
        tracking: mockTrackingState({ items: [] }),
        notifications: [
          mockNotification({ id: trackingStateNotificationId('ghost') }),
        ],
      });

      await emissions(effects.reconcileState$);

      expect(stored.items).toEqual([]);
    });

    it('leaves non-tracking notifications untouched', async () => {
      setup(of(TrackingActions.resetAllTracking()), {
        tracking: mockTrackingState({ items: [] }),
        notifications: [mockNotification({ id: 'debug-1' })],
      });

      await emissions(effects.reconcileState$);

      expect(stored.items.map((n) => n.id)).toEqual(['debug-1']);
    });

    it('preserves updatedAt for a cascade item whose kind did not change', async () => {
      const target = mockTrackingItem({
        id: 'a',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      const cascade = mockTrackingItem({ id: 'b', state: 'running' });
      setup(of(TrackingActions.toggleTrackingItem(target, 'now')), {
        tracking: mockTrackingState({ items: [target, cascade] }),
        notifications: [
          mockNotification({
            id: trackingStateNotificationId('b'),
            updatedAt: OLD,
            action: { type: 'tracking.pause', trackingItemId: 'b' },
          }),
        ],
      });

      await emissions(effects.reconcileState$);

      const cascadeNotif = stored.items.find(
        (n) => n.id === trackingStateNotificationId('b')
      );
      expect(cascadeNotif?.updatedAt).toBe(OLD);
    });
  });

  describe('applyNotificationCommand$ (durable)', () => {
    it('toggles with a stopped hint for a tracking.start CTA', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'stopped' });
      setup(of(TrackingActions.applyNotificationCommand('n1')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: [
          mockNotification({
            id: 'n1',
            action: { type: 'tracking.start', trackingItemId: 't1' },
          }),
        ],
      });

      const emitted = await emissions(effects.applyNotificationCommand$);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].type).toBe(TrackingActions.toggleTrackingItem.type);
      const toggled = emitted[0] as ReturnType<
        typeof TrackingActions.toggleTrackingItem
      >;
      expect(toggled.item.id).toBe('t1');
      expect(toggled.item.state).toBe('stopped');
      // No separate markDone dispatch — reconcile (triggered by the toggle)
      // updates the notification; the store is not mutated here.
      expect(store.mutate).not.toHaveBeenCalled();
    });

    it('flips the hint to running for a tracking.pause CTA', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'running' });
      setup(of(TrackingActions.applyNotificationCommand('n1')), {
        tracking: mockTrackingState({ items: [item] }),
        notifications: [
          mockNotification({
            id: 'n1',
            action: { type: 'tracking.pause', trackingItemId: 't1' },
          }),
        ],
      });

      const emitted = await emissions(effects.applyNotificationCommand$);
      const toggled = emitted[0] as ReturnType<
        typeof TrackingActions.toggleTrackingItem
      >;
      expect(toggled.item.state).toBe('running');
    });

    it('dismisses the notification durably (no toggle) when the item is gone', async () => {
      setup(of(TrackingActions.applyNotificationCommand('n1')), {
        tracking: mockTrackingState({ items: [] }),
        notifications: [
          mockNotification({
            id: 'n1',
            action: { type: 'tracking.start', trackingItemId: 'ghost' },
          }),
        ],
      });

      const emitted = await emissions(effects.applyNotificationCommand$);

      expect(emitted).toEqual([]);
      expect(store.mutate).toHaveBeenCalled();
      expect(stored.items.find((n) => n.id === 'n1')?.status).toBe('done');
    });

    it('emits nothing when the notification has no action', async () => {
      setup(of(TrackingActions.applyNotificationCommand('n1')), {
        notifications: [mockNotification({ id: 'n1', action: undefined })],
      });

      expect(await emissions(effects.applyNotificationCommand$)).toEqual([]);
      expect(store.mutate).not.toHaveBeenCalled();
    });
  });
});
