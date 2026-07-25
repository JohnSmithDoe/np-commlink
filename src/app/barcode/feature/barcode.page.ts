import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../@shared/ui/page-header/page-header.component';
import { BarcodeInputComponent } from '../smart-ui/barcode-input/barcode-input.component';
import { BarcodeFacade } from '../data';

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
  readonly #facade = inject(BarcodeFacade);
  readonly barcode = this.#facade.barcode;

  rotateBarcode() {
    this.#facade.rotateBarcode();
  }

  deleteBarcode() {
    this.#facade.deleteBarcode();
  }
}
