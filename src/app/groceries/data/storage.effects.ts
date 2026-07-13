import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { createShoppingItemFromStorage } from '../../@shared/util/item.factory';
import { matchesItemExactly } from '../../@shared/util/app.utils';
import { ShoppingActions } from './shopping.actions';
import { selectShoppingState } from './shopping.selector';
import { StorageActions } from './storage.actions';

@Injectable({ providedIn: 'root' })
export class StorageEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  copyFromShoppingList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addShoppingList),
      map(({ items }) => {
        return ShoppingActions.removeItems(items);
      })
    );
  });

  copyToShoppingList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.copyToShoppinglist),
      concatLatestFrom(() => this.#store.select(selectShoppingState)),
      map(([{ item }, state]) => {
        const shoppingItem = createShoppingItemFromStorage(item);
        const found = matchesItemExactly(shoppingItem, state.items);
        if (found) {
          return ShoppingActions.updateItem({
            ...found,
            quantity: found.quantity + 1,
          });
        }
        return ShoppingActions.addOrUpdateItem(shoppingItem);
      })
    );
  });
}
