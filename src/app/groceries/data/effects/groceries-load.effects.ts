import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { IProductsState, IShoppingState, IStorageState } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { GroceriesActions } from '../groceries.actions';

// Own-data load for the grocery bounded context (lazy-modules plan §4). Reads
// the three grocery keys and emits one atomic `loaded` so all three slices
// hydrate together. Registered in the lazy providers, so it only reads storage
// when a grocery route is entered — not at boot. On a storage failure it still
// emits `loaded` (with nulls → initialState) so the resolver unblocks and the
// page paints empty rather than hanging.
@Injectable({ providedIn: 'root' })
export class GroceriesLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceriesActions.load),
      switchMap(() =>
        from(
          Promise.all([
            this.#database.load<IProductsState>('products'),
            this.#database.load<IShoppingState>('shopping'),
            this.#database.load<IStorageState>('storage'),
          ])
        ).pipe(
          map(([products, shopping, storage]) =>
            GroceriesActions.loaded({ products, shopping, storage })
          ),
          catchError(() =>
            of(
              GroceriesActions.loaded({
                products: null,
                shopping: null,
                storage: null,
              })
            )
          )
        )
      )
    );
  });
}
