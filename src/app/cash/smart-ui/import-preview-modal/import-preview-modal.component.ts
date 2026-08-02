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
import { CashTransaction } from '../../model/transaction.types';
import { CashFacade } from '../../data';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';

import { CategoryId } from '../../../@shared/model/category.types';

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

  transactions: CashTransaction[] = [];
  duplicates = 0;
  rejected = 0;

  categoryName(id: CategoryId | undefined): string {
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
