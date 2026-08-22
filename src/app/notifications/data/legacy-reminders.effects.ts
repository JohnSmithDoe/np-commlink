/* ─── why ─────────────────────────────────────────────────────────
 * One boot, one cancel. An older build armed the 09:00 office nudge from a
 * kernel initializer, so the OS holds a cron no domain re-affirms: office-time
 * owns that decision now, but its slice hydrates on route, and a deck with
 * OFFICE switched off never reaches the effect that would clear it. The kernel
 * hydrates at boot, and the cron is the kernel's own leftover.
 *
 * It runs ONCE, recorded in the slice, because cancelling on every boot would
 * disarm the reminder of anyone who has since switched it on — only the office
 * page re-arms, and nobody opens it every session. Running it costs nothing:
 * the switch that replaced the initializer did not exist when the cron was
 * placed, so no user had asked for one.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, filter, from, map, of } from 'rxjs';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { NotificationsInboxActions } from './notifications.actions';
import { selectLegacyCronsCleared } from './notifications.selector';

@Injectable({ providedIn: 'root' })
export class LegacyRemindersEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #notifications = inject(LocalNotificationsService);

  clearLegacyCrons$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsInboxActions.loaded),
      concatLatestFrom(() => this.#store.select(selectLegacyCronsCleared)),
      filter(([, cleared]) => !cleared),
      concatMap(() =>
        from(this.#notifications.cancel('officeReminder')).pipe(
          catchError(() => of(undefined)),
          map(() => NotificationsInboxActions.legacyCronsCleared())
        )
      )
    );
  });
}
