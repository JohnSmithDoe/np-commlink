import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { TrackingActions } from './tracking.actions';

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
          parameters: { name: item.name },
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
          parameters: { name: item.name },
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
          parameters: { name: item.name },
          color: 'warning',
        })
      )
    );
  });
}
