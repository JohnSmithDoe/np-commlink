import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { BarcodeActions } from './barcode.actions';
import { selectBarcodeDataUrl } from './barcode.selector';

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
        key: marker('barcode.upload.error'),
        color: 'danger',
      })
    );
  }
}
