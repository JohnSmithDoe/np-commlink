import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { OfficeReminder } from '../model/office-time.types';
import { mockOfficeTimeState } from '../testing/office-time.test-data';
import { OfficeTimeActions } from './office-time.actions';
import { OfficeTimeReminderEffects } from './office-time-reminder.effects';
import { OFFICE_TIME_STATE_KEY } from './office-time.selector';

const at = (hour: number, minute: number): OfficeReminder => ({
  enabled: true,
  hour,
  minute,
});

const off: OfficeReminder = { enabled: false, hour: 9, minute: 0 };

const refusal = NotificationsActions.toast({
  key: 'office-time.reminder.refused',
  color: 'danger',
});

describe('OfficeTimeReminderEffects', () => {
  let actions$: Observable<Action>;
  let effects: OfficeTimeReminderEffects;
  let notifications: {
    cancel: ReturnType<typeof vi.fn>;
    scheduleDaily: ReturnType<typeof vi.fn>;
  };

  const setup = (reminder: OfficeReminder, armed = true) => {
    notifications = {
      cancel: vi.fn().mockResolvedValue(undefined),
      scheduleDaily: vi.fn().mockResolvedValue(armed),
    };
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeReminderEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            [OFFICE_TIME_STATE_KEY]: mockOfficeTimeState({ reminder }),
          },
        }),
        { provide: LocalNotificationsService, useValue: notifications },
      ],
    });
    effects = TestBed.inject(OfficeTimeReminderEffects);
  };

  const drain = (effect: Observable<unknown>) =>
    firstValueFrom(effect.pipe(toArray()));
  const scheduled = () => notifications.scheduleDaily.mock.calls[0][0];

  it('arms the reminder under its own source, wording and time', async () => {
    setup(at(8, 15));
    actions$ = of(OfficeTimeActions.setReminder(at(8, 15)));

    await drain(effects.changeReminder$);

    expect(scheduled()).toEqual({
      source: 'officeReminder',
      titleKey: 'office-time.reminder.title',
      bodyKey: 'office-time.reminder.body',
      hour: 8,
      minute: 15,
    });
  });

  it('cancels rather than reschedules when the reminder is switched off', async () => {
    setup(off);
    actions$ = of(OfficeTimeActions.setReminder(off));

    await drain(effects.changeReminder$);

    expect(notifications.cancel).toHaveBeenCalledWith('officeReminder');
    expect(notifications.scheduleDaily).not.toHaveBeenCalled();
  });

  it('re-arms on load, so a schedule the system dropped comes back', async () => {
    setup(at(9, 0));
    actions$ = of(OfficeTimeActions.loaded(null));

    await drain(effects.restoreReminder$);

    expect(scheduled()).toEqual(expect.objectContaining({ hour: 9 }));
  });

  it('clears a schedule nothing owns, when the reminder is off at load time', async () => {
    setup(off);
    actions$ = of(OfficeTimeActions.loaded(null));

    await drain(effects.restoreReminder$);

    expect(notifications.cancel).toHaveBeenCalledWith('officeReminder');
  });

  it('clears the schedule when the data is reset', async () => {
    setup(off);
    actions$ = of(OfficeTimeActions.resetData());

    await drain(effects.restoreReminder$);

    expect(notifications.cancel).toHaveBeenCalledWith('officeReminder');
  });

  it('says so when the OS refuses the reminder the user just asked for', async () => {
    setup(at(8, 0), false);
    actions$ = of(OfficeTimeActions.setReminder(at(8, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([refusal]);
  });

  it('reports a scheduling error the same way it reports a refusal', async () => {
    setup(at(8, 0));
    notifications.scheduleDaily.mockRejectedValue(new Error('no alarms'));
    actions$ = of(OfficeTimeActions.setReminder(at(8, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([refusal]);
  });

  it('stays quiet about a success', async () => {
    setup(at(8, 0));
    actions$ = of(OfficeTimeActions.setReminder(at(8, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([]);
  });
});
