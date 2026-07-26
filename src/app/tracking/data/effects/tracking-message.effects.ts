import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { TrackingActions } from '../actions/tracking.actions';

/**
 * Toast reactions to tracking mutations. Formerly the shell-level
 * `AppMessageEffects`; it only ever listened to `TrackingActions`, so it belongs
 * to the tracking bounded context and rides its lazy providers. Registering it
 * lazily with tracking is behaviourally identical to the old eager wiring —
 * `TrackingActions` cannot be dispatched before the tracking route is live.
 *
 * Each reaction now *dispatches* the published `toast` contract instead of
 * calling a UI service: the message is data (key + params + color) and the
 * notifications domain presents it, so tracking needs neither `ToastController`
 * nor `TranslateService`.
 */
@Injectable()
export class TrackingMessageEffects {
  readonly #actions$ = inject(Actions);

  savedSuccess$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.saveAndResetTracking),
      map(() => NotificationsActions.toast({ key: marker('toast.saved') }))
    );
  });

  addItemSuccess$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addItem),
      filter(({ item }) => item.name.length > 0),
      map(({ item }) =>
        NotificationsActions.toast({
          key: marker('toast.add.item'),
          params: { name: item.name },
        })
      )
    );
  });

  addItemFailure$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addItemFailure),
      map(({ item }) =>
        NotificationsActions.toast({
          key: marker('toast.add.item.failure'),
          params: { name: item.name },
          color: 'medium',
        })
      )
    );
  });

  updateItemSuccess$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.updateItem),
      map(({ item }) =>
        NotificationsActions.toast({
          key: marker('toast.update.item'),
          params: { name: item.name },
        })
      )
    );
  });

  removeItemSuccess$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.removeItem),
      map(({ item }) =>
        NotificationsActions.toast({
          key: marker('toast.remove.item'),
          params: { name: item.name },
          color: 'warning',
        })
      )
    );
  });
}
