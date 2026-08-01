import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
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
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { ICashTransaction } from '../../model/transaction.types';
import { CashFacade } from '../../data';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';

import { TCategoryId } from '../../../@shared/model/category.types';

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
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashImportPreviewModalComponent {
  readonly #facade = inject(CashFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #categories = this.#facade.categories;
  readonly #categoryName = computed(() =>
    categoryNameLookup(this.#categories())
  );

  /** Imperative componentProps. */
  transactions: ICashTransaction[] = [];
  duplicates = 0;
  rejected = 0;

  /** Resolve an auto-assigned category id to its display name. */
  categoryName(id: TCategoryId | undefined): string {
    return this.#categoryName()(id);
  }

  confirm(): void {
    if (this.transactions.length > 0) {
      this.#facade.importTransactions(this.transactions);
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
