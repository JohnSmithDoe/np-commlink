import { inject, Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createSaveEffect } from '../../../@shared/data/create-save.effect';
import { NotificationsActions } from '../../../@shared/data/notification/notifications.actions';
import { selectNotificationsState } from '../notifications.selector';

// Own-data save for notifications. Triggers on specific mutation actions (never
// `load`/`loaded`), so a load can't clobber saved data.
@Injectable({ providedIn: 'root' })
export class NotificationsSaveEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);

  saveNotificationsOnChange$ = createSaveEffect(
    this.#store,
    this.#database,
    this.#actions$.pipe(
      ofType(
        NotificationsActions.addNotification,
        NotificationsActions.upsertNotification,
        NotificationsActions.markDone,
        NotificationsActions.markNew,
        NotificationsActions.removeNotification,
        NotificationsActions.clearDone,
        NotificationsActions.toggleDoneSection,
        NotificationsActions.markPageViewed
      )
    ),
    selectNotificationsState,
    'notifications'
  );
}
