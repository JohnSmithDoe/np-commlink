import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { IBarcodeState } from '../model';
import { BarcodeActions } from './barcode.actions';
import { DatabaseService } from '../../@shared/util/database.service';

// Own-data load for the barcode context. Reads the `barcode` key and emits
// `loaded`; the reducer hydrates on it. Runs from the route's
// moduleHydrationResolver on each `/barcode` entry.
@Injectable({ providedIn: 'root' })
export class BarcodeLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(BarcodeActions.load),
      switchMap(() =>
        from(this.#database.load<IBarcodeState>('barcode')).pipe(
          map((barcode) => BarcodeActions.loaded(barcode)),
          catchError(() => of(BarcodeActions.loaded(null)))
        )
      )
    );
  });
}
