import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BarcodeFacade } from '../../data';
import { IonButton } from '@ionic/angular/standalone';
import { readBadgeImage } from '../../util/barcode.utils';

@Component({
  selector: 'app-barcode-input',
  templateUrl: './barcode-input.component.html',
  styleUrls: ['./barcode-input.component.scss'],
  imports: [TranslatePipe, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeInputComponent {
  readonly #facade = inject(BarcodeFacade);

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const badge = await readBadgeImage(file);
    if (badge) this.#facade.saveBarcode(badge);
    else this.#facade.reportUploadFailure();
  }
}
