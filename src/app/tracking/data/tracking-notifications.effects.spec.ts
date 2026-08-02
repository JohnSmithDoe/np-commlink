import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import {
  mockKernelState,
  TEST_TIMESTAMP,
} from '../../@shared/testing/test-data';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../testing/tracking.test-data';
import { TrackingState } from '../model/tracking.types';
import { TrackingActions } from './tracking.actions';
import { TrackingNotificationsEffects } from './tracking-notifications.effects';
import { trackingStateNotificationId } from '../util/tracking-notifications.utils';
import { ProjectedNotification } from '../../@shared/model/notifications.types';

const projected = async (
  effect: Observable<Action>
): Promise<ProjectedNotification[]> => {
  const emitted = (await firstValueFrom(effect)) as ReturnType<
    typeof NotificationsActions.project
  >;
  expect(emitted.type).toBe(NotificationsActions.project.type);
  expect(emitted.owner).toBe('tracking');
  return emitted.notifications;
};

describe('TrackingNotificationsEffects', () => {
  let effects: TrackingNotificationsEffects;

  const setup = (actions$: Observable<Action>, tracking?: TrackingState) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingNotificationsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({
            tracking: tracking ?? mockTrackingState({ items: [] }),
          }),
        }),
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    effects = TestBed.inject(TrackingNotificationsEffects);
  };

  it('is created', () => {
    setup(of());
    expect(effects).toBeTruthy();
  });

  describe('reconcileState$', () => {
    it('projects a running state notification for the toggled item', async () => {
      const item = mockTrackingItem({
        id: 't1',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      setup(
        of(TrackingActions.toggleTrackingItem(item, 'now')),
        mockTrackingState({ items: [item] })
      );

      const rows = await projected(effects.reconcileState$);

      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(trackingStateNotificationId('t1'));
      expect(rows[0].icon).toBe('play-circle');
      expect(rows[0].action?.type).toBe('tracking.pause');
      expect(rows[0].action?.labelKey).toBe('notifications.action.pause');
      expect(rows[0].variant).toBe('running');
    });

    it('projects nothing for items with no tracking to report', async () => {
      setup(
        of(TrackingActions.resetAllTracking()),
        mockTrackingState({ items: [mockTrackingItem({ id: 'ghost' })] })
      );

      expect(await projected(effects.reconcileState$)).toEqual([]);
    });

    it('stamps updatedAt for the acted-on item and leaves the cascade to the inbox', async () => {
      const target = mockTrackingItem({
        id: 'a',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      const cascade = mockTrackingItem({
        id: 'b',
        state: 'running',
        startTime: TEST_TIMESTAMP,
      });
      setup(
        of(TrackingActions.toggleTrackingItem(target, 'now')),
        mockTrackingState({ items: [target, cascade] })
      );

      const rows = await projected(effects.reconcileState$);

      const byId = (id: string) =>
        rows.find((row) => row.id === trackingStateNotificationId(id));
      expect(byId('a')?.updatedAt).toBeTruthy();
      expect(byId('b')?.updatedAt).toBeUndefined();
    });
  });

  describe('applyNotificationCommand$', () => {
    it('toggles with a stopped hint for a tracking.start CTA', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'stopped' });
      setup(
        of(TrackingActions.applyNotificationCommand('tracking.start', 't1')),
        mockTrackingState({ items: [item] })
      );

      const emitted = await firstValueFrom(effects.applyNotificationCommand$);

      expect(emitted.type).toBe(TrackingActions.toggleTrackingItem.type);
      const toggled = emitted as ReturnType<
        typeof TrackingActions.toggleTrackingItem
      >;
      expect(toggled.item.id).toBe('t1');
      expect(toggled.item.state).toBe('stopped');
    });

    it('flips the hint to running for a tracking.pause CTA', async () => {
      const item = mockTrackingItem({ id: 't1', state: 'running' });
      setup(
        of(TrackingActions.applyNotificationCommand('tracking.pause', 't1')),
        mockTrackingState({ items: [item] })
      );

      const emitted = (await firstValueFrom(
        effects.applyNotificationCommand$
      )) as ReturnType<typeof TrackingActions.toggleTrackingItem>;

      expect(emitted.item.state).toBe('running');
    });

    it('re-projects (no toggle) when the item is gone', async () => {
      setup(
        of(TrackingActions.applyNotificationCommand('tracking.start', 'ghost')),
        mockTrackingState({ items: [] })
      );

      expect(await projected(effects.applyNotificationCommand$)).toEqual([]);
    });
  });
});
