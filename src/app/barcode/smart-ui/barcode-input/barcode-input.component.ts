import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BarcodeFacade } from '../../data';
import { IonButton } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ToastService } from '../../../@shared/util/toast.service';

@Component({
  selector: 'app-barcode-input',
  templateUrl: './barcode-input.component.html',
  styleUrls: ['./barcode-input.component.scss'],
  imports: [TranslateModule, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeInputComponent {
  readonly #facade = inject(BarcodeFacade);
  readonly #ui = inject(ToastService);
  readonly #translate = inject(TranslateService);

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const dataUrl = e.target?.result as string;
      this.#facade.saveBarcode(dataUrl);
    });
    reader.addEventListener('error', () => {
      const message = this.#translate.instant(
        marker('officetime.barcode.upload.error')
      );
      void this.#ui.showToast(message, 'danger');
    });
    reader.readAsDataURL(file);
  }
}
