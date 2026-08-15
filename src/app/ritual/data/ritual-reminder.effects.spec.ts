import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { RitualReminder, RitualState } from '../model/ritual.types';
import { mockRitualState } from '../testing/ritual.test-data';
import { RitualActions } from './ritual.actions';
import { RitualReminderEffects } from './ritual-reminder.effects';
import { RITUAL_STATE_KEY } from './ritual.selector';

const at = (hour: number, minute: number): RitualReminder => ({
  enabled: true,
  hour,
  minute,
});

const refusal = NotificationsActions.toast({
  key: 'ritual.reminder.refused',
  color: 'danger',
});

describe('RitualReminderEffects', () => {
  let actions$: Observable<Action>;
  let effects: RitualReminderEffects;
  let notifications: {
    cancel: ReturnType<typeof vi.fn>;
    scheduleDaily: ReturnType<typeof vi.fn>;
  };

  const setup = (state: RitualState, armed = true) => {
    notifications = {
      cancel: vi.fn().mockResolvedValue(undefined),
      scheduleDaily: vi.fn().mockResolvedValue(armed),
    };
    TestBed.configureTestingModule({
      providers: [
        RitualReminderEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { [RITUAL_STATE_KEY]: state } }),
        { provide: LocalNotificationsService, useValue: notifications },
      ],
    });
    effects = TestBed.inject(RitualReminderEffects);
  };

  const drain = (effect: Observable<unknown>) =>
    firstValueFrom(effect.pipe(toArray()));
  const scheduled = () => notifications.scheduleDaily.mock.calls[0][0];

  it('arms the reminder under its own source, wording and time', async () => {
    setup(mockRitualState({ reminder: at(18, 30) }));
    actions$ = of(RitualActions.setReminder(at(18, 30)));

    await drain(effects.changeReminder$);

    expect(scheduled()).toEqual({
      source: 'ritualReminder',
      titleKey: 'ritual.reminder.title',
      bodyKey: 'ritual.reminder.body',
      hour: 18,
      minute: 30,
    });
  });

  it('cancels rather than reschedules when the reminder is switched off', async () => {
    const off = { enabled: false, hour: 18, minute: 0 };
    setup(mockRitualState({ reminder: off }));
    actions$ = of(RitualActions.setReminder(off));

    await drain(effects.changeReminder$);

    expect(notifications.cancel).toHaveBeenCalledWith('ritualReminder');
    expect(notifications.scheduleDaily).not.toHaveBeenCalled();
  });

  it('re-arms on load, so a schedule the system dropped comes back', async () => {
    setup(mockRitualState({ reminder: at(9, 0) }));
    actions$ = of(RitualActions.loaded(null));

    await drain(effects.restoreReminder$);

    expect(scheduled()).toEqual(expect.objectContaining({ hour: 9 }));
  });

  it('says so when the OS refuses the reminder the user just asked for', async () => {
    setup(mockRitualState({ reminder: at(18, 0) }), false);
    actions$ = of(RitualActions.setReminder(at(18, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([refusal]);
  });

  it('reports a scheduling error the same way it reports a refusal', async () => {
    setup(mockRitualState({ reminder: at(18, 0) }));
    notifications.scheduleDaily.mockRejectedValue(new Error('no alarms'));
    actions$ = of(RitualActions.setReminder(at(18, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([refusal]);
  });

  it('stays quiet about a success', async () => {
    setup(mockRitualState({ reminder: at(18, 0) }));
    actions$ = of(RitualActions.setReminder(at(18, 0)));

    expect(await drain(effects.changeReminder$)).toEqual([]);
  });

  it('emits nothing dispatchable on load, refused or not', async () => {
    setup(mockRitualState({ reminder: at(18, 0) }), false);
    actions$ = of(RitualActions.loaded(null));

    const emitted = await drain(effects.restoreReminder$);

    expect(emitted).toEqual([false]);
    expect(emitted).not.toContainEqual(refusal);
  });
});
