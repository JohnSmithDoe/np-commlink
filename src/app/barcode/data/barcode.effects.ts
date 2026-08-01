import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  map,
  switchMap,
  take,
} from 'rxjs';
import { BarcodeActions } from './barcode.actions';
import { selectBarcodeState } from './barcode.selector';
import { rotateBase64 } from '../util/barcode.utils';

@Injectable({ providedIn: 'root' })
export class BarcodeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);

  rotateBarcode$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(BarcodeActions.rotateBarcode),
      // A rotation is relative to the badge as it stands now, so taps have to
      // queue and each one has to read the state its predecessor committed:
      // `switchMap` dropped the second tap outright and a `withLatestFrom`
      // upstream of the flattening operator would hand it the pre-rotation
      // badge — either way a double tap turned the badge 90° instead of 180°.
      concatMap(() =>
        this.#store.select(selectBarcodeState).pipe(
          take(1),
          switchMap((state) => rotateBase64(state.dataUrl)),
          // rotateBase64 resolves undefined itself (no badge set, missing 2D
          // context), so there is nothing here to second-guess.
          filter((rotated): rotated is string => !!rotated),
          map((rotated) => BarcodeActions.rotateBarcodeSuccess(rotated)),
          catchError(() => EMPTY)
        )
      )
    );
  });
}
