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
  tap,
  withLatestFrom,
} from 'rxjs';
import { DatabaseService } from '../../@shared/util/database.service';
import { BarcodeActions } from './barcode.actions';
import { selectBarcodeState } from './barcode.selector';
import { rotateBase64 } from '../util/barcode.utils';

@Injectable({ providedIn: 'root' })
export class BarcodeEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  rotateBarcode$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(BarcodeActions.rotateBarcode),
      withLatestFrom(this.#store.select(selectBarcodeState)),
      switchMap(([_, state]) => {
        return from(rotateBase64(state.dataUrl, 90)).pipe(
          // When rotation actually produced a new image, commit it.
          // Otherwise (no badge set, image load error, draw failure) emit
          // nothing so we don't churn the save effect with an identical write.
          mergeMap((rotated) =>
            rotated && rotated !== state.dataUrl
              ? of(BarcodeActions.rotateBarcodeSuccess(rotated))
              : EMPTY
          ),
          catchError(() => EMPTY)
        );
      })
    );
  });

  // Persist the slice after any mutation. Matches specific mutation actions
  // (never `load`/`loaded`), so hydration can't clobber the saved value. The
  // reducer runs before this effect, so the store already holds the new slice.
  saveOn$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          BarcodeActions.saveBarcode,
          BarcodeActions.deleteBarcode,
          BarcodeActions.rotateBarcodeSuccess
        ),
        withLatestFrom(this.#store.select(selectBarcodeState)),
        tap(([, state]) => void this.#database.save('barcode', state))
      );
    },
    { dispatch: false }
  );
}
