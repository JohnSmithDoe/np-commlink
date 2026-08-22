/* ─── why ─────────────────────────────────────────────────────────
 * Two triggers, two effects, because they answer differently: a load
 * re-arms in silence and a change speaks. A refusal is permanent, so
 * reporting one on every cold start would nag about a decision already
 * made — turning the switch on is the one moment the answer is news. Only
 * `refused` speaks: off native there was no cron to place, and saying so in
 * red would call the browser broken.
 *
 * `concatMap`, never `switchMap`: dropping a subscription cannot recall a
 * cancel/schedule pair already in flight, and the time the user abandoned
 * would win.
 *
 * The reminder is read from the STORE on both paths, never from the change
 * action's payload, because an effect runs after the reducer — so one code
 * path serves the load that has no payload and the change that does.
 *
 * OFF cancels rather than declining to arm: once a cron is set the OS owns
 * it, so a schedule this build did not place still has to be reachable.
 * ───────────────────────────────────────────────────────────────── */
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { ActionCreator, MemoizedSelector, Store } from '@ngrx/store';
import { catchError, concatMap, filter, from, map, Observable, of } from 'rxjs';
import { Marker } from '../../model/app.types';
import { FixedIdSource } from '../../model/notification-sources';
import { NotificationsActions } from '../actions/notifications.actions';
import {
  LocalNotificationsService,
  ReminderOutcome,
} from './local-notifications.service';

export interface DailyReminderSchedule {
  enabled: boolean;
  hour: number;
  minute: number;
}

type ArmOutcome = ReminderOutcome | 'cleared';

export const createDailyReminderEffects = (config: {
  armOn: ActionCreator[];
  changeOn: ActionCreator[];
  select: MemoizedSelector<object, DailyReminderSchedule>;
  source: FixedIdSource;
  titleKey: Marker;
  bodyKey: Marker;
  refusedKey: Marker;
}) => {
  const armOrClear = async (
    notifications: LocalNotificationsService,
    { enabled, hour, minute }: DailyReminderSchedule
  ): Promise<ArmOutcome> => {
    if (!enabled) {
      await notifications.cancel(config.source);
      return 'cleared';
    }
    return notifications.scheduleDaily({
      source: config.source,
      titleKey: config.titleKey,
      bodyKey: config.bodyKey,
      hour,
      minute,
    });
  };

  const applied = (
    notifications: LocalNotificationsService,
    reminder: DailyReminderSchedule
  ): Observable<ArmOutcome> =>
    from(armOrClear(notifications, reminder)).pipe(
      catchError(() => of<ArmOutcome>('refused'))
    );

  return {
    [`restore_${config.source}$`]: createEffect(
      (
        actions$ = inject(Actions),
        store = inject(Store),
        notifications = inject(LocalNotificationsService)
      ) => {
        return actions$.pipe(
          ofType(...config.armOn),
          concatLatestFrom(() => store.select(config.select)),
          concatMap(([, reminder]) => applied(notifications, reminder))
        );
      },
      { functional: true, dispatch: false }
    ),

    [`change_${config.source}$`]: createEffect(
      (
        actions$ = inject(Actions),
        store = inject(Store),
        notifications = inject(LocalNotificationsService)
      ) => {
        return actions$.pipe(
          ofType(...config.changeOn),
          concatLatestFrom(() => store.select(config.select)),
          concatMap(([, reminder]) => applied(notifications, reminder)),
          filter((outcome) => outcome === 'refused'),
          map(() =>
            NotificationsActions.toast({
              key: config.refusedKey,
              color: 'danger',
            })
          )
        );
      },
      { functional: true }
    ),
  };
};
