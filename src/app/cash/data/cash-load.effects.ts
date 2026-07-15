import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ICashState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';
import { CashActions } from './cash.actions';

// Own-data load for the cash context (lazy-modules plan §4). Reads the `cash`
// key and emits `loaded`; the reducer hydrates on it.
@Injectable({ providedIn: 'root' })
export class CashLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CashActions.load),
      switchMap(() =>
        from(this.#database.load<ICashState>('cash')).pipe(
          map((cash) => CashActions.loaded(cash)),
          catchError(() => of(CashActions.loaded(null)))
        )
      )
    );
  });
}
