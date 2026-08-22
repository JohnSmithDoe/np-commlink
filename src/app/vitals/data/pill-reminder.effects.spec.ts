import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import {
  LocalNotificationsService,
  ReminderOutcome,
} from '../../@shared/data/services/local-notifications.service';
import { VitalsState } from '../model/vitals.types';
import {
  mockPill,
  mockPillsState,
  mockProfile,
  mockProfilesState,
  mockVitalsState,
} from '../testing/vitals.test-data';
import { pillNotificationBlock, pillNotificationId } from '../util/pill.utils';
import { PillReminderEffects } from './pill-reminder.effects';
import { PillsActions } from './pills/pills.actions';
import { VitalsActions } from './vitals.actions';
import { VITALS_STATE_KEY } from './vitals.selector';

const refusal = NotificationsActions.toast({
  key: 'vitals.pill.reminder.refused',
  color: 'danger',
});

const martin = mockProfile();

describe('PillReminderEffects', () => {
  let actions$: Observable<Action>;
  let effects: PillReminderEffects;
  let notifications: {
    cancelIds: ReturnType<typeof vi.fn>;
    scheduleWeekly: ReturnType<typeof vi.fn>;
  };

  const setup = (state: VitalsState, outcome: ReminderOutcome = 'armed') => {
    notifications = {
      cancelIds: vi.fn().mockResolvedValue(undefined),
      scheduleWeekly: vi.fn().mockResolvedValue(outcome),
    };
    TestBed.configureTestingModule({
      providers: [
        PillReminderEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { [VITALS_STATE_KEY]: state } }),
        { provide: LocalNotificationsService, useValue: notifications },
      ],
    });
    effects = TestBed.inject(PillReminderEffects);
  };

  const drain = (effect: Observable<unknown>) =>
    firstValueFrom(effect.pipe(toArray()));

  const stateWith = (...pills: ReturnType<typeof mockPill>[]) =>
    mockVitalsState({
      profiles: mockProfilesState([martin]),
      pills: mockPillsState(pills, { nextSlot: pills.length }),
    });

  it('arms one weekly cron per due weekday, at the pill’s own time', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1, 4], hour: 18, minute: 30 });
    setup(stateWith(pill));
    actions$ = of(PillsActions.addItem(pill));

    await drain(effects.changeReminders$);

    expect(notifications.scheduleWeekly).toHaveBeenCalledTimes(2);
    expect(notifications.scheduleWeekly).toHaveBeenCalledWith({
      id: pillNotificationId(0, 1),
      source: 'pillReminder',
      titleKey: 'vitals.pill.reminder.title',
      bodyKey: 'vitals.pill.reminder.body',
      parameters: { name: pill.name, dose: '1', profile: martin.name },
      isoWeekday: 1,
      hour: 18,
      minute: 30,
    });
  });

  it('clears the pill’s whole block before arming, so a dropped day stops', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1] });
    setup(stateWith(pill));
    actions$ = of(PillsActions.updateItem(pill));

    await drain(effects.changeReminders$);

    const cancelled = notifications.cancelIds.mock.calls[0][0];
    expect(cancelled).toEqual(expect.arrayContaining(pillNotificationBlock(0)));
    expect(notifications.cancelIds).toHaveBeenCalledBefore(
      notifications.scheduleWeekly
    );
  });

  it('clears a deleted pill’s block even though its slot is gone from state', async () => {
    const deleted = mockPill({ id: 'gone', slot: 0 });
    setup(
      mockVitalsState({
        profiles: mockProfilesState([martin]),
        pills: mockPillsState([], { nextSlot: 1 }),
      })
    );
    actions$ = of(PillsActions.removeItem(deleted));

    await drain(effects.changeReminders$);

    expect(notifications.cancelIds).toHaveBeenCalledWith(
      expect.arrayContaining(pillNotificationBlock(0))
    );
    expect(notifications.scheduleWeekly).not.toHaveBeenCalled();
  });

  it('arms nothing for a pill whose switch is off', async () => {
    const pill = mockPill({ slot: 0, remind: false });
    setup(stateWith(pill));
    actions$ = of(PillsActions.updateItem(pill));

    await drain(effects.changeReminders$);

    expect(notifications.scheduleWeekly).not.toHaveBeenCalled();
    expect(notifications.cancelIds).toHaveBeenCalled();
  });

  it('re-arms every pill on load, and says nothing', async () => {
    const pill = mockPill({ slot: 0, weekdays: [2] });
    setup(stateWith(pill));
    actions$ = of(VitalsActions.loaded(null));

    const emitted = await drain(effects.restoreReminders$);

    expect(notifications.scheduleWeekly).toHaveBeenCalledTimes(1);
    expect(emitted).not.toContainEqual(refusal);
  });

  it('says so when the OS refuses a reminder the user just asked for', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1] });
    setup(stateWith(pill), 'refused');
    actions$ = of(PillsActions.addItem(pill));

    expect(await drain(effects.changeReminders$)).toEqual([refusal]);
  });

  it('reports a scheduling error the same way it reports a refusal', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1] });
    setup(stateWith(pill));
    notifications.scheduleWeekly.mockRejectedValue(new Error('no alarms'));
    actions$ = of(PillsActions.addItem(pill));

    expect(await drain(effects.changeReminders$)).toEqual([refusal]);
  });

  it('stays quiet in a browser, where there was no cron to place', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1] });
    setup(stateWith(pill), 'unsupported');
    actions$ = of(PillsActions.addItem(pill));

    expect(await drain(effects.changeReminders$)).toEqual([]);
  });

  it('stays quiet when a sweep armed nothing, so a delete is not a refusal', async () => {
    const deleted = mockPill({ id: 'gone', slot: 0 });
    setup(
      mockVitalsState({
        profiles: mockProfilesState([martin]),
        pills: mockPillsState([], { nextSlot: 1 }),
      }),
      'refused'
    );
    actions$ = of(PillsActions.removeItem(deleted));

    expect(await drain(effects.changeReminders$)).toEqual([]);
  });

  it('stays quiet about a success', async () => {
    const pill = mockPill({ slot: 0, weekdays: [1] });
    setup(stateWith(pill));
    actions$ = of(PillsActions.addItem(pill));

    expect(await drain(effects.changeReminders$)).toEqual([]);
  });

  it('leaves a taken-today tick alone — it is not a schedule change', async () => {
    const pill = mockPill({ slot: 0 });
    setup(stateWith(pill));
    actions$ = of(PillsActions.setTaken(pill.id, '2026-08-22', true));

    await drain(effects.changeReminders$);

    expect(notifications.cancelIds).not.toHaveBeenCalled();
    expect(notifications.scheduleWeekly).not.toHaveBeenCalled();
  });
});
