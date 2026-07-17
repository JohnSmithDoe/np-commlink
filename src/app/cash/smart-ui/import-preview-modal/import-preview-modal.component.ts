import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { ICashTransaction } from '../../../@shared/types';
import { CashActions } from '../../data';
import { MoneyEurPipe } from '../../util/money.pipe';

/**
 * Preview a parsed CSV import before committing (via `ModalController`). Fed the
 * already-planned `transactions` (deduped + auto-categorized by `planImport`)
 * and the `duplicates` count as imperative componentProps. Confirm dispatches a
 * single bulk `Import Transactions`; cancel discards.
 */
@Component({
  selector: 'app-cash-import-preview-modal',
  templateUrl: './import-preview-modal.component.html',
  styleUrls: ['./import-preview-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    TranslateModule,
    MoneyEurPipe,
  ],
})
export class CashImportPreviewModalComponent {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);

  /** Imperative componentProps. */
  transactions: ICashTransaction[] = [];
  duplicates = 0;

  formatDate(iso: string): string {
    return dayjs(iso).format('DD.MM.YYYY');
  }

  confirm(): void {
    if (this.transactions.length) {
      this.#store.dispatch(CashActions.importTransactions(this.transactions));
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
