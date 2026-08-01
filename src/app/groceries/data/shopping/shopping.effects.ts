import { ShareService } from '../../../@shared/util/services/share.service';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { catchError, EMPTY, map, switchMap } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { StorageActions } from '../storage/storage.actions';
import { ShoppingActions } from './shopping.actions';
import { selectShoppingState } from './shopping.selector';

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
      concatLatestFrom(() => this.#store.select(selectShoppingState)),
      map(([, shopping]) => {
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
        concatLatestFrom(() => this.#store.select(selectShoppingState)),
        switchMap(([, shopping]) => {
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
