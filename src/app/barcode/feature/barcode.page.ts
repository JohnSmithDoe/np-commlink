import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../@shared/ui/page-header/page-header.component';
import { BarcodeInputComponent } from '../smart-ui/barcode-input/barcode-input.component';
import { BarcodeActions, selectBarcodeDataUrl } from '../data';

@Component({
  selector: 'app-page-barcode',
  templateUrl: 'barcode.page.html',
  styleUrls: ['barcode.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    IonContent,
    IonList,
    IonItem,
    IonButton,
    BarcodeInputComponent,
  ],
})
export class BarcodePage {
  readonly #store = inject(Store);
  readonly barcode = this.#store.selectSignal(selectBarcodeDataUrl);

  rotateBarcode() {
    this.#store.dispatch(BarcodeActions.rotateBarcode());
  }

  deleteBarcode() {
    this.#store.dispatch(BarcodeActions.deleteBarcode());
  }
}
