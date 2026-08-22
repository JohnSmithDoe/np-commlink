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
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { CashTransaction } from '../../model/transaction.types';
import {
  CashAccountsFacade,
  CashCategoriesFacade,
  CashSchedulesFacade,
  CashTransactionsFacade,
} from '../../data';
import { ScheduleAmountChange } from '../../model/schedule.types';
import { balanceDifferenceCents } from '../../util/import/balance-check';
import { ImportConfirmation } from '../../util/import/plan-import';
import { changedAmounts } from '../../util/schedule.utils';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { categoryIdOf } from '../../util/cash-category.utils';

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
  readonly #facade = inject(CashTransactionsFacade);
  readonly #accountsFacade = inject(CashAccountsFacade);
  readonly #schedulesFacade = inject(CashSchedulesFacade);
  readonly #categoriesFacade = inject(CashCategoriesFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #categories = this.#categoriesFacade.allItems;
  readonly #categoryName = computed(() =>
    categoryNameLookup(this.#categories())
  );

  transactions: CashTransaction[] = [];
  confirmations: ImportConfirmation[] = [];
  duplicates = 0;
  rejected = 0;
  accountId = '';
  closingBalanceCents?: number;
  asOfISO?: string;
  sightings: ScheduleAmountChange[] = [];

  readonly categoryIdOf = categoryIdOf;

  get amountChanges(): ScheduleAmountChange[] {
    return changedAmounts(this.sightings);
  }

  categoryName(id: CategoryId | undefined): string {
    return this.#categoryName()(id);
  }

  scheduleName(scheduleId: string): string {
    return (
      this.#schedulesFacade.allItems().find(({ id }) => id === scheduleId)
        ?.name ?? ''
    );
  }

  confirm(): void {
    if (this.transactions.length > 0 || this.confirmations.length > 0) {
      this.#facade.importItems(this.transactions, this.confirmations);
    }
    if (this.sightings.length > 0) {
      this.#schedulesFacade.applyAmountChanges(this.sightings);
      const learned = this.amountChanges.length;
      if (learned > 0) this.#schedulesFacade.reportAmountsLearned(learned);
    }
    this.#checkAgainstBankBalance();
    void this.#modalCtrl.dismiss();
  }

  #checkAgainstBankBalance(): void {
    const { closingBalanceCents, asOfISO, accountId } = this;
    if (closingBalanceCents === undefined || asOfISO === undefined) return;
    const account = this.#accountsFacade
      .allItems()
      .find(({ id }) => id === accountId);
    if (!account) return;

    const difference = balanceDifferenceCents(
      closingBalanceCents,
      asOfISO,
      accountId,
      account.openingBalanceCents,
      this.#facade.allItems()
    );
    if (difference !== 0) {
      this.#accountsFacade.reportBalanceMismatch(difference);
    }
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
