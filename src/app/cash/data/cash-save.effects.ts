import { inject, Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../@shared/util/database.service';
import { selectCashState } from './cash.selector';

// Persist the cash ledger slice on any [Cash] MUTATION (lazy-modules plan §4:
// each module owns its own save). Registered lazily with the cash slice on the
// /cash route (see provide-cash-lazy.ts), so `state.cash` is always present
// when this runs.
//
// Excludes the `[Cash] load`/`[Cash] loaded` hydration lifecycle: the route
// resolver dispatches `[Cash] load` on entry while the slice is still at empty
// initialState (before CashLoadEffects reads storage back), so persisting on it
// would clobber the saved ledger. Hydration is not a mutation.
@Injectable({ providedIn: 'root' })
export class CashSaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter(
          (action: { type: string }) =>
            /^\[Cash\]/.test(action.type) &&
            !/\] (load|loaded)$/.test(action.type)
        ),
        withLatestFrom(
          this.#store.select(selectCashState),
          (_action, cash) => cash
        ),
        tap((cash) => {
          void this.#database.save('cash', cash);
        })
      );
    },
    { dispatch: false }
  );
}
