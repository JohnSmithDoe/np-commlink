import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import {
  bySourcePrefix,
  createSaveEffect,
} from '../../../@shared/data/create-save.effect';
import { selectCashState } from '../cash.selector';

// Persist the cash ledger slice on any [Cash] MUTATION (lazy-modules plan §4:
// each module owns its own save). Registered lazily with the cash slice on the
// /cash route (see provide-cash-lazy.ts), so `state.cash` is always present
// when this runs.
//
// `bySourcePrefix` excludes the `[Cash] load`/`[Cash] loaded` hydration
// lifecycle: the route resolver dispatches `[Cash] load` on entry while the
// slice is still at empty initialState (before CashLoadEffects reads storage
// back), so persisting on it would clobber the saved ledger. Not a mutation.
@Injectable({ providedIn: 'root' })
export class CashSaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createSaveEffect(
    this.#store,
    this.#database,
    this.#actions$.pipe(filter(bySourcePrefix('[Cash]'))),
    selectCashState,
    'cash'
  );
}
