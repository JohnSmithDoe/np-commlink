import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { ICashState } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { CashActions } from '../cash.actions';

// Own-data load for the cash context (lazy-modules plan §4). Reads the `cash`
// key and emits `loaded`; the reducer hydrates on it.
@Injectable({ providedIn: 'root' })
export class CashLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<ICashState>(
    this.#actions$,
    this.#database,
    CashActions.load,
    CashActions.loaded,
    'cash'
  );
}
