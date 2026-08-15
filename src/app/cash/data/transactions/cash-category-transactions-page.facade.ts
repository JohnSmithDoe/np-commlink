/* ─── why ─────────────────────────────────────────────────────────
 * A read-only drill-down: this page IS one category's transactions, so
 * there is nothing to filter by and nothing to create. Editing still goes
 * through `CashTransactionsFacade`.
 *
 * It is the one page that hand-picks its commands instead of handing over
 * the whole action group: that group HAS an `addItemFromSearch`, which
 * would dispatch a real create when you press enter in a report's search
 * box. Withholding it falls back to an empty `showCreateDialog`, so enter
 * does nothing — which is the answer.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { TRANSACTION_SORT_OPTIONS } from '../../model/transaction.types';
import { categoryById } from '../../../@shared/util/categories/category.utils';
import { CashTransaction } from '../../model/transaction.types';
import { CashCategoriesFacade } from '../categories/cash-categories.facade';
import { CashTransactionsActions } from './cash-transactions.actions';
import { CashTransactionsFacade } from './cash-transactions.facade';
import {
  selectRoutedCategoryId,
  selectRoutedCategorySearchResult,
  selectRoutedCategoryTransactions,
  selectRoutedCategoryTransactionsState,
} from './cash-transactions.selector';

@Injectable({ providedIn: 'root' })
export class CashCategoryTransactionsPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #transactions = inject(CashTransactionsFacade);
  readonly #categories = inject(CashCategoriesFacade);

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: CashTransactionsActions.updateSearch,
    updateSort: CashTransactionsActions.updateSort,
  });

  readonly categoryId = this.#store.selectSignal(selectRoutedCategoryId);

  readonly state = this.#store.selectSignal(
    selectRoutedCategoryTransactionsState
  );
  readonly items = this.#store.selectSignal(selectRoutedCategoryTransactions);
  readonly searchResult = this.#store.selectSignal(
    selectRoutedCategorySearchResult
  );

  readonly sortOptions = signal(TRANSACTION_SORT_OPTIONS);

  readonly heading = computed(
    () =>
      categoryById(this.#categories.allItems(), this.categoryId())?.name ?? ''
  );

  readonly totalCents = computed(() =>
    this.items().reduce((sum, txn) => sum + txn.amountCents, 0)
  );

  showCreateDialog(): void {}

  showEditDialog(item: CashTransaction): void {
    this.#transactions.showEditDialog(item);
  }
}
