import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  EMPTY,
  from,
  mergeMap,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { BarcodeActions } from '../actions/barcode.actions';
import { selectBarcodeState } from '../selectors/barcode.selector';
import { rotateBase64 } from '../../util/barcode.utils';

@Injectable({ providedIn: 'root' })
export class BarcodeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);

  rotateBarcode$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(BarcodeActions.rotateBarcode),
      withLatestFrom(this.#store.select(selectBarcodeState)),
      switchMap(([_, state]) => {
        return from(rotateBase64(state.dataUrl, 90)).pipe(
          // Commit whatever rotateBase64 produced; it returns undefined itself
          // (no badge set, missing 2D context) so there is nothing here to
          // second-guess.
          mergeMap((rotated) =>
            rotated ? of(BarcodeActions.rotateBarcodeSuccess(rotated)) : EMPTY
          ),
          catchError(() => EMPTY)
        );
      })
    );
  });
}
