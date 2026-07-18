import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../@shared/util/database.service';
import { NotificationsActions } from '../../@shared/util/notifications/notifications.actions';
import { selectNotificationsState } from './notifications.selector';

// Own-data save for the notifications context. Relocated from the eager shell
// `AppEffects` (which is deleted this phase) into its own class. Stays EAGER
// for now — notifications is still an eager capability sink (tracking writes it
// off-route); it moves into lazy notifications providers in the §Phase-4
// notifications-lazy cutover. Matches specific mutation actions (never
// `load`/`loaded`), so a load can't clobber saved data.
@Injectable({ providedIn: 'root' })
export class NotificationsSaveEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);

  saveNotificationsOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          NotificationsActions.addNotification,
          NotificationsActions.upsertNotification,
          NotificationsActions.markDone,
          NotificationsActions.markNew,
          NotificationsActions.removeNotification,
          NotificationsActions.clearDone,
          NotificationsActions.toggleDoneSection,
          NotificationsActions.markPageViewed
        ),
        withLatestFrom(
          this.#store.select(selectNotificationsState),
          (_action, notifications) => notifications
        ),
        tap((notifications) => {
          void this.#database.save('notifications', notifications);
        })
      );
    },
    { dispatch: false }
  );
}
