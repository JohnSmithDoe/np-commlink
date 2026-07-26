import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { BarcodeActions } from './actions/barcode.actions';
import { selectBarcodeDataUrl } from './selectors/barcode.selector';

/**
 * The `barcode` (SIGIL) domain facade — the single NgRx surface for the barcode
 * page and its upload input. Holds the uploaded badge data-URL and the
 * rotate/delete/save commands. Injects `Store` so the components never do — the
 * unreadable-file message included, which is why the input needs no
 * `TranslateService` of its own.
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

  reportUploadFailure(): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('officetime.barcode.upload.error'),
        color: 'danger',
      })
    );
  }
}
