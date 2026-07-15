import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { INotificationsState } from '../../@shared/types';
import { NotificationsActions } from '../../@shared/data/notifications/notifications.actions';
import { DatabaseService } from '../../@shared/util/database.service';

// Own-data load for the notifications context (lazy-modules plan §4). Reads the
// `notifications` key and emits `loaded`; the reducer hydrates on it.
@Injectable({ providedIn: 'root' })
export class NotificationsLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(NotificationsActions.load),
      switchMap(() =>
        from(this.#database.load<INotificationsState>('notifications')).pipe(
          map((notifications) => NotificationsActions.loaded(notifications)),
          catchError(() => of(NotificationsActions.loaded(null)))
        )
      )
    );
  });
}
