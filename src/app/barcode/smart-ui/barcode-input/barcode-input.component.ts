import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { BarcodeActions } from '../../data';
import { IonButton } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { UiService } from '../../../@shared/util/ui.service';

@Component({
  selector: 'app-barcode-input',
  templateUrl: './barcode-input.component.html',
  styleUrls: ['./barcode-input.component.scss'],
  imports: [TranslateModule, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeInputComponent {
  readonly #store = inject(Store);
  readonly #ui = inject(UiService);
  readonly #translate = inject(TranslateService);

  onFileSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.#store.dispatch(BarcodeActions.saveBarcode(dataUrl));
    };
    reader.onerror = () => {
      const msg = this.#translate.instant(
        marker('officetime.barcode.upload.error')
      );
      void this.#ui.showToast(msg, 'danger');
    };
    reader.readAsDataURL(file);
  }
}
