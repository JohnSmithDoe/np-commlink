import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CashBurndownFacade, CashTransactionsFacade } from '../../data';
import { CashTransaction } from '../../model/transaction.types';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { CashSpendQuickAddComponent } from '../spend-quick-add/spend-quick-add.component';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-page-cash-spending',
  templateUrl: './cash-spending.page.html',
  styleUrls: ['./cash-spending.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    PageHeaderComponent,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
    CashSpendQuickAddComponent,
  ],
})
export class CashSpendingPage {
  readonly #facade = inject(CashBurndownFacade);
  readonly #transactions = inject(CashTransactionsFacade);

  readonly burndown = this.#facade.burndown;
  readonly spends = this.#facade.monthSpends;

  readonly overToday = computed(() => this.burndown().remainingTodayCents < 0);

  editSpend(transaction: CashTransaction): void {
    this.#transactions.showEditDialog(transaction);
  }
}
