import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BarcodeFacade } from '../../data';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-barcode-input',
  templateUrl: './barcode-input.component.html',
  styleUrls: ['./barcode-input.component.scss'],
  imports: [TranslateModule, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeInputComponent {
  readonly #facade = inject(BarcodeFacade);

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const dataUrl = e.target?.result as string;
      this.#facade.saveBarcode(dataUrl);
    });
    reader.addEventListener('error', () => this.#facade.reportUploadFailure());
    reader.readAsDataURL(file);
  }
}
