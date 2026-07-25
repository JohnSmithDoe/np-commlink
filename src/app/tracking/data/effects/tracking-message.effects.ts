import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { ToastService } from '../../../@shared/util/toast.service';
import { TrackingActions } from '../tracking.actions';

/**
 * Toast reactions to tracking mutations. Formerly the shell-level
 * `AppMessageEffects`; it only ever listened to `TrackingActions`, so it belongs
 * to the tracking bounded context and rides its lazy providers. Registering it
 * lazily with tracking is behaviourally identical to the old eager wiring —
 * `TrackingActions` cannot be dispatched before the tracking route is live.
 */
@Injectable()
export class TrackingMessageEffects {
  #actions$ = inject(Actions);
  #uiService = inject(ToastService);

  savedSuccess$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.saveAndResetTracking),
        tap(() => {
          void this.#uiService.showSavedToast();
        })
      );
    },
    { dispatch: false }
  );

  addItemSuccess$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.addItem),
        tap(({ item }) => {
          if (item.name.length === 0) return;
          void this.#uiService.showAddItemToast(item.name);
        })
      );
    },
    { dispatch: false }
  );

  addItemFailure$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.addItemFailure),
        tap(({ item }) => {
          void this.#uiService.showItemContainedToast(item.name);
        })
      );
    },
    { dispatch: false }
  );

  updateItemSuccess$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.updateItem),
        tap(({ item }) => {
          if (!item) return;
          void this.#uiService.showUpdateItemToast(item);
        })
      );
    },
    { dispatch: false }
  );

  removeItemSuccess$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(TrackingActions.removeItem),
        tap(({ item }) => {
          void this.#uiService.showRemoveItemToast(item.name);
        })
      );
    },
    { dispatch: false }
  );
}
