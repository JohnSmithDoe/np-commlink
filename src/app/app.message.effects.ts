import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { UiService } from './@shared/util/ui.service';
import { TrackingActions } from './tracking/data';

@Injectable({ providedIn: 'root' })
export class AppMessageEffects {
  #actions$ = inject(Actions);
  #uiService = inject(UiService);

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
