/* ─── why ─────────────────────────────────────────────────────────
 * Biggest first, not newest first. This is a worklist and the money is the
 * priority: filing the €480 insurance debit moves the trust figure further
 * than filing eleven coffees, and the report's own percentage is weighted by
 * amount too — so the order matches what it is trying to fix.
 *
 * The window is the report's, on purpose. Arriving here from a figure that
 * said "this month" and finding two years of bookings would answer a
 * question nobody asked.
 * ───────────────────────────────────────────────────────────────── */
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
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CashReportFacade, CashTransactionsFacade } from '../../data';
import { CashTransaction } from '../../model/transaction.types';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';

@Component({
  selector: 'app-page-cash-uncategorized',
  templateUrl: './cash-uncategorized.page.html',
  styleUrls: ['./cash-uncategorized.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    TranslatePipe,
    LocalizedDatePipe,
    MoneyEurPipe,
  ],
})
export class CashUncategorizedPage {
  readonly #report = inject(CashReportFacade);
  readonly #transactions = inject(CashTransactionsFacade);

  readonly rows = this.#report.uncategorizedOutflows;

  readonly totalCents = computed(() => {
    let total = 0;
    for (const txn of this.rows()) total += txn.amountCents;
    return total;
  });

  openTransaction(txn: CashTransaction): void {
    this.#transactions.showEditDialog(txn);
  }
}
