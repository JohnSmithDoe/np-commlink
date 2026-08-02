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
      concatMap(() =>
        this.#store.select(selectBarcodeState).pipe(
          take(1),
          switchMap((state) => rotateBase64(state.dataUrl)),
          filter((rotated): rotated is string => !!rotated),
          map((rotated) => BarcodeActions.rotateBarcodeSuccess(rotated)),
          catchError(() => EMPTY)
        )
      )
    );
  });
}
