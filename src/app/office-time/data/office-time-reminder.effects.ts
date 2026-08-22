/* ─── why ─────────────────────────────────────────────────────────
 * Whether to remind belongs to the domain that owns the concept, so the
 * office nudge is armed from here and not from the kernel — a reminder
 * armed at boot fires for people who never switched this program on, and
 * leaves them no switch but the OS notification settings.
 *
 * `enabled` defaults to OFF, and a disabled reminder CANCELS rather than
 * merely declining to arm: once a cron is set the OS owns it, so a
 * schedule this domain did not place still has to be reachable, and
 * `loaded` is the only moment that reliably comes around.
 *
 * The two-effect split and `concatMap` are the ritual reminder's reasons,
 * spelled out in `ritual/data/ritual-reminder.effects.ts`.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, filter, from, map, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { OfficeReminder } from '../model/office-time.types';
import { OfficeTimeActions } from './office-time.actions';
import { selectOfficeReminder } from './office-time.selector';

const REMINDER_TITLE = marker('office-time.reminder.title');
const REMINDER_BODY = marker('office-time.reminder.body');
const REMINDER_REFUSED = marker('office-time.reminder.refused');

@Injectable({ providedIn: 'root' })
export class OfficeTimeReminderEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #notifications = inject(LocalNotificationsService);

  restoreReminder$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(OfficeTimeActions.loaded, OfficeTimeActions.resetData),
        concatLatestFrom(() => this.#store.select(selectOfficeReminder)),
        concatMap(([, reminder]) => this.#applyReminder(reminder))
      );
    },
    { dispatch: false }
  );

  changeReminder$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.setReminder),
      concatMap(({ reminder }) => this.#applyReminder(reminder)),
      filter((armed) => !armed),
      map(() =>
        NotificationsActions.toast({ key: REMINDER_REFUSED, color: 'danger' })
      )
    );
  });

  #applyReminder(reminder: OfficeReminder): Observable<boolean> {
    return from(this.#armOrClear(reminder)).pipe(catchError(() => of(false)));
  }

  async #armOrClear(reminder: OfficeReminder): Promise<boolean> {
    const { enabled, hour, minute } = reminder;
    if (!enabled) {
      await this.#notifications.cancel('officeReminder');
      return true;
    }

    return this.#notifications.scheduleDaily({
      source: 'officeReminder',
      titleKey: REMINDER_TITLE,
      bodyKey: REMINDER_BODY,
      hour,
      minute,
    });
  }
}
