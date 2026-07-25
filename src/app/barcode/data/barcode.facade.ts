import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BarcodeActions } from './barcode.actions';
import { selectBarcodeDataUrl } from './barcode.selector';

/**
 * The `barcode` (SIGIL) domain facade — the single NgRx surface for the barcode
 * page and its upload input. Holds the uploaded badge data-URL and the
 * rotate/delete/save commands. Injects `Store` so the components never do.
 */
@Injectable({ providedIn: 'root' })
export class BarcodeFacade {
  readonly #store = inject(Store);

  readonly barcode = this.#store.selectSignal(selectBarcodeDataUrl);

  rotateBarcode(): void {
    this.#store.dispatch(BarcodeActions.rotateBarcode());
  }

  deleteBarcode(): void {
    this.#store.dispatch(BarcodeActions.deleteBarcode());
  }

  saveBarcode(dataUrl: string): void {
    this.#store.dispatch(BarcodeActions.saveBarcode(dataUrl));
  }
}
