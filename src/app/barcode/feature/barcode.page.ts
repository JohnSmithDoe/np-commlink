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
import { OfficeTimeActions } from '../../office-time/data/office-time/office-time.actions';
import { selectBarcodeDataUrl } from '../../office-time/data/office-time/office-time.selector';

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
    this.#store.dispatch(OfficeTimeActions.rotateBarcode());
  }

  deleteBarcode() {
    this.#store.dispatch(OfficeTimeActions.deleteBarcode());
  }
}
