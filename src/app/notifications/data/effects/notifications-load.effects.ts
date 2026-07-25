import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { INotificationsState } from '../../../@shared/model/types';
import { NotificationsActions } from '../../../@shared/data/notification/notifications.actions';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';

// Own-data load for the notifications context (lazy-modules plan §4). Reads the
// `notifications` key and emits `loaded`; the reducer hydrates on it.
@Injectable({ providedIn: 'root' })
export class NotificationsLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<INotificationsState>(
    this.#actions$,
    this.#database,
    NotificationsActions.load,
    NotificationsActions.loaded,
    'notifications'
  );
}
