import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { CashImportFacade } from '../../data';
import { CashImportPreview } from '../../model/import.types';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-cash-import-preview-modal',
  templateUrl: './import-preview-modal.component.html',
  styleUrls: ['./import-preview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashImportPreviewModalComponent {
  readonly #import = inject(CashImportFacade);
  readonly #modalCtrl = inject(ModalController);

  preview!: CashImportPreview;

  confirm(): void {
    this.#import.commit(this.preview);
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
