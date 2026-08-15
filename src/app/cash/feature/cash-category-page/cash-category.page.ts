import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonNote } from '@ionic/angular/standalone';
import {
  CashAccountsFacade,
  CashCategoryTransactionsPageFacade,
} from '../../data';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { CashTransaction } from '../../model/transaction.types';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';

@Component({
  selector: 'app-page-cash-category',
  templateUrl: './cash-category.page.html',
  styleUrls: ['./cash-category.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    ListItemComponent,
    IonNote,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
  providers: [
    { provide: LIST_FACADE, useExisting: CashCategoryTransactionsPageFacade },
  ],
})
export class CashCategoryPage {
  readonly facade = inject(CashCategoryTransactionsPageFacade);
  readonly #accountsFacade = inject(CashAccountsFacade);
  readonly #router = inject(Router);

  readonly #accountNameById = computed(
    () =>
      new Map(this.#accountsFacade.allItems().map(({ id, name }) => [id, name]))
  );

  accountName(txn: CashTransaction): string {
    return this.#accountNameById().get(txn.accountId) ?? '';
  }

  openAccount(txn: CashTransaction): void {
    void this.#router.navigate(['/cash', txn.accountId]);
  }
}
