import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { IBarcodeState } from '../../model';
import { BarcodeActions } from '../barcode.actions';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';

// Own-data load for the barcode context. Reads the `barcode` key and emits
// `loaded`; the reducer hydrates on it. Runs from the route's
// moduleHydrationResolver on each `/barcode` entry.
@Injectable({ providedIn: 'root' })
export class BarcodeLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<IBarcodeState>(
    this.#actions$,
    this.#database,
    BarcodeActions.load,
    BarcodeActions.loaded,
    'barcode'
  );
}
