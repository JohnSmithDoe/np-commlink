import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import {
  Action,
  createActionGroup,
  createFeatureSelector,
  createSelector,
  emptyProps,
} from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsActions } from '../actions/notifications.actions';
import {
  createDailyReminderEffects,
  DailyReminderSchedule,
} from './daily-reminder.effects.factory';
import {
  LocalNotificationsService,
  ReminderOutcome,
} from './local-notifications.service';

const STATE_KEY = 'probe';

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    loaded: emptyProps(),
    setReminder: emptyProps(),
    unrelated: emptyProps(),
  },
});

const selectProbe = createFeatureSelector<{ reminder: DailyReminderSchedule }>(
  STATE_KEY
);
const selectProbeReminder = createSelector(
  selectProbe,
  (state) => state.reminder
);

const refusal = NotificationsActions.toast({
  key: 'probe.reminder.refused',
  color: 'danger',
});

const at = (hour: number, minute: number): DailyReminderSchedule => ({
  enabled: true,
  hour,
  minute,
});

describe('createDailyReminderEffects', () => {
  let actions$: Observable<Action>;
  let notifications: {
    cancel: ReturnType<typeof vi.fn>;
    scheduleDaily: ReturnType<typeof vi.fn>;
  };
  let effects: ReturnType<typeof createDailyReminderEffects>;

  const setup = (
    reminder: DailyReminderSchedule,
    outcome: ReminderOutcome = 'armed'
  ) => {
    notifications = {
      cancel: vi.fn().mockResolvedValue(undefined),
      scheduleDaily: vi.fn().mockResolvedValue(outcome),
    };
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { [STATE_KEY]: { reminder } } }),
        { provide: LocalNotificationsService, useValue: notifications },
      ],
    });
    effects = createDailyReminderEffects({
      armOn: [ProbeActions.loaded],
      changeOn: [ProbeActions.setReminder],
      select: selectProbeReminder,
      source: 'ritualReminder',
      titleKey: 'probe.reminder.title',
      bodyKey: 'probe.reminder.body',
      refusedKey: 'probe.reminder.refused',
    });
  };

  const drain = (key: string) =>
    firstValueFrom(
      (
        TestBed.runInInjectionContext(() =>
          effects[key]()
        ) as Observable<unknown>
      ).pipe(toArray())
    );

  const restore$ = () => drain('restore_ritualReminder$');
  const change$ = () => drain('change_ritualReminder$');

  it('arms the reminder under its own source, wording and time', async () => {
    setup(at(18, 30));
    actions$ = of(ProbeActions.setReminder());

    await change$();

    expect(notifications.scheduleDaily).toHaveBeenCalledWith({
      source: 'ritualReminder',
      titleKey: 'probe.reminder.title',
      bodyKey: 'probe.reminder.body',
      hour: 18,
      minute: 30,
    });
  });

  it('cancels instead of arming when the switch is off', async () => {
    setup({ enabled: false, hour: 9, minute: 0 });
    actions$ = of(ProbeActions.setReminder());

    expect(await change$()).toEqual([]);
    expect(notifications.cancel).toHaveBeenCalledWith('ritualReminder');
    expect(notifications.scheduleDaily).not.toHaveBeenCalled();
  });

  it('re-arms on the load trigger, and says nothing', async () => {
    setup(at(9, 0), 'refused');
    actions$ = of(ProbeActions.loaded());

    const emitted = await restore$();

    expect(notifications.scheduleDaily).toHaveBeenCalled();
    expect(emitted).not.toContainEqual(refusal);
  });

  it('says so when the OS refuses the reminder the user just asked for', async () => {
    setup(at(9, 0), 'refused');
    actions$ = of(ProbeActions.setReminder());

    expect(await change$()).toEqual([refusal]);
  });

  it('stays quiet where there is no cron to place', async () => {
    setup(at(9, 0), 'unsupported');
    actions$ = of(ProbeActions.setReminder());

    expect(await change$()).toEqual([]);
  });

  it('reports a scheduling error the same way it reports a refusal', async () => {
    setup(at(9, 0));
    notifications.scheduleDaily.mockRejectedValue(new Error('no alarms'));
    actions$ = of(ProbeActions.setReminder());

    expect(await change$()).toEqual([refusal]);
  });

  it('ignores an action it was not given', async () => {
    setup(at(9, 0));
    actions$ = of(ProbeActions.unrelated());

    expect(await change$()).toEqual([]);
    expect(notifications.scheduleDaily).not.toHaveBeenCalled();
  });
});
