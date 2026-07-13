import { inject, Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, switchMap, withLatestFrom } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { IAppState } from '../../@shared/types';
import { StorageActions } from './storage.actions';
import { ShoppingActions } from './shopping.actions';

@Injectable({ providedIn: 'root' })
export class ShoppingEffects {
  #store = inject(Store<IAppState>);
  #actions$ = inject(Actions);

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
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const boughtItems = state.shopping.items.filter(
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
        withLatestFrom(this.#store, (action, state: IAppState) => ({
          action,
          state,
        })),
        switchMap(({ action, state }) => {
          const activeItems = state.shopping.items.filter(
            (item) => item.state === 'active'
          );
          const text =
            activeItems
              .map((item) => item.quantity + ' x ' + item.name)
              .join('\n') ?? 'Nix drin';
          return fromPromise(
            Share.share({
              title: 'Einkaufsliste',
              text,
              dialogTitle: 'Share with buddies',
            })
          );
        })
      );
    },
    { dispatch: false }
  );
}
