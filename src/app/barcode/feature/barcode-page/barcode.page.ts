import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AlertButton,
  IonAlert,
  IonButton,
  IonContent,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { BarcodeInputComponent } from '../../smart-ui/barcode-input/barcode-input.component';
import { BarcodeFacade } from '../../data';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-page-barcode',
  templateUrl: 'barcode.page.html',
  styleUrls: ['barcode.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslatePipe,
    IonContent,
    IonList,
    IonItem,
    IonButton,
    IonAlert,
    BarcodeInputComponent,
  ],
})
export class BarcodePage {
  readonly #facade = inject(BarcodeFacade);
  readonly #translate = inject(TranslateService);

  readonly barcode = this.#facade.barcode;

  readonly deleteAlertButtons: AlertButton[] = [
    {
      text: this.#translate.instant(marker('barcode.action.cancel')),
      role: 'cancel',
    },
    {
      text: this.#translate.instant(marker('barcode.action.delete')),
      role: 'destructive',
      handler: () => this.deleteBarcode(),
    },
  ];

  constructor() {
    addIcons({ barcodeOutline });
  }

  rotateBarcode() {
    this.#facade.rotateBarcode();
  }

  deleteBarcode() {
    this.#facade.deleteBarcode();
  }
}
