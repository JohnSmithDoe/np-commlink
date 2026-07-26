import { ShareService } from '../../../@shared/util/share.service';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { catchError, EMPTY, map, switchMap, withLatestFrom } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { StorageActions } from '../actions/storage.actions';
import { ShoppingActions } from '../actions/shopping.actions';
import { selectShoppingState } from '../selectors/shopping.selector';

@Injectable({ providedIn: 'root' })
export class ShoppingEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #translate = inject(TranslateService);
  readonly #share = inject(ShareService);

  buyItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.buyItem),
      map(({ item }) =>
        ShoppingActions.updateItem({ ...item, state: 'bought' })
      )
    );
  });

  moveToStorageList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.moveToStorage),
      withLatestFrom(
        this.#store.select(selectShoppingState),
        (action, shopping) => ({
          action,
          shopping,
        })
      ),
      map(({ shopping }) => {
        const boughtItems = shopping.items.filter(
          (item) => item.state === 'bought'
        );
        return StorageActions.addShoppingList(boughtItems);
      })
    );
  });

  shareShoppingList$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(ShoppingActions.shareShoppinglist),
        withLatestFrom(
          this.#store.select(selectShoppingState),
          (action, shopping) => ({
            action,
            shopping,
          })
        ),
        switchMap(({ shopping }) => {
          const activeItems = shopping.items.filter(
            (item) => item.state === 'active'
          );
          const text = activeItems
            .map((item) => item.quantity + ' x ' + item.name)
            .join('\n');
          return fromPromise(
            this.#share.share({
              title: this.#translate.instant(
                marker('grocery.shopping.share.title')
              ),
              text,
              dialogTitle: this.#translate.instant(
                marker('grocery.shopping.share.dialog')
              ),
            })
            // Share.share rejects when the user dismisses the sheet.
          ).pipe(catchError(() => EMPTY));
        })
      );
    },
    { dispatch: false }
  );
}
