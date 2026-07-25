import { inject, Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { selectGroceryLists } from '../grocery-list/grocery-list.selector';

// Persist a grocery slice whenever its domain dispatches a mutation
// (lazy-modules Phase E: the grocery context owns its own save). Split out of
// the shell's saveGroceryOnChange$ and registered lazily with the grocery
// slices on the grocery routes (see provide-groceries-lazy.ts), so the target
// slice is always present when this runs.
//
// The action-source prefix (`[Products]`/`[Shopping]`/`[Storage]`) names the
// slice to write; a `[GroceryCategories]` mutation (add/rename/remove) hits the
// one shared catalog, so it persists all three slices. Groceries hydrate via the
// separate `[Groceries] load/loaded` source (co-hydration), which never matches
// this filter — so unlike the tasks save there is no boot-clobber path here. The
// `!/\] (load|loaded)$/` guard is kept defensively so a future per-slice load
// could never clobber saved data.
@Injectable({ providedIn: 'root' })
export class GrocerySaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter(
          (action: { type: string }) =>
            /^\[(Products|Shopping|Storage|GroceryCategories)\]/.test(
              action.type
            ) && !/\] (load|loaded)$/.test(action.type)
        ),
        withLatestFrom(
          this.#store.select(selectGroceryLists),
          (action, state) => ({
            action,
            state,
          })
        ),
        tap(({ action, state }) => {
          if (action.type.startsWith('[Products]')) {
            void this.#database.save('products', state.products);
          } else if (action.type.startsWith('[Shopping]')) {
            void this.#database.save('shopping', state.shopping);
          } else if (action.type.startsWith('[Storage]')) {
            void this.#database.save('storage', state.storage);
          } else {
            // [GroceryCategories] — one shared catalog, all three slices change.
            void this.#database.save('products', state.products);
            void this.#database.save('shopping', state.shopping);
            void this.#database.save('storage', state.storage);
          }
        })
      );
    },
    { dispatch: false }
  );
}
