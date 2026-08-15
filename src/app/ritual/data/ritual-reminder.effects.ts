/* ─── why ─────────────────────────────────────────────────────────
 * Two triggers, two effects, because they answer differently: a load
 * re-arms in silence and a change speaks. A refusal is permanent, so
 * reporting one on every cold start would nag about a decision already
 * made — turning the switch on is the one moment the answer is news.
 *
 * They cannot collide over the single notification id they share: the
 * route resolver awaits `loaded` before `/ritual` activates, so there is
 * no settings page to dispatch `setReminder` until the load has landed.
 * The overlap that does happen is two changes in a row, and `concatMap`
 * is what queues those. `switchMap` would not — dropping a subscription
 * cannot recall a cancel/schedule pair already in flight, and the time
 * the user abandoned would win.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, filter, from, map, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { RitualState } from '../model/ritual.types';
import { RitualActions } from './ritual.actions';
import { selectRitualState } from './ritual.selector';

const REMINDER_TITLE = marker('ritual.reminder.title');
const REMINDER_BODY = marker('ritual.reminder.body');
const REMINDER_REFUSED = marker('ritual.reminder.refused');

@Injectable({ providedIn: 'root' })
export class RitualReminderEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #notifications = inject(LocalNotificationsService);

  restoreReminder$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(RitualActions.loaded),
        concatLatestFrom(() => this.#store.select(selectRitualState)),
        concatMap(([, state]) => this.#applyReminder(state))
      );
    },
    { dispatch: false }
  );

  changeReminder$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(RitualActions.setReminder),
      concatLatestFrom(() => this.#store.select(selectRitualState)),
      concatMap(([, state]) => this.#applyReminder(state)),
      filter((armed) => !armed),
      map(() =>
        NotificationsActions.toast({ key: REMINDER_REFUSED, color: 'danger' })
      )
    );
  });

  #applyReminder(state: RitualState): Observable<boolean> {
    return from(this.#armOrClear(state)).pipe(catchError(() => of(false)));
  }

  async #armOrClear(state: RitualState): Promise<boolean> {
    const { enabled, hour, minute } = state.reminder;
    if (!enabled) {
      await this.#notifications.cancel('ritualReminder');
      return true;
    }

    return this.#notifications.scheduleDaily({
      source: 'ritualReminder',
      titleKey: REMINDER_TITLE,
      bodyKey: REMINDER_BODY,
      hour,
      minute,
    });
  }
}
