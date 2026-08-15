/* ─── why ─────────────────────────────────────────────────────────
 * The account id comes from `selectRouteParams` INSIDE the selectors, not
 * from an injected `ActivatedRoute`. That is what lets a `data`-layer
 * facade answer "which account" at all: Sheriff seals `data → feature`, so
 * the page cannot hand it down, and a facade taking it as an argument
 * could not implement `ListPageFacade`, whose members are plain signals.
 *
 * `catalog` is the cash category list, which is why this page gains a
 * filter bar — chips, `matcherForFilter` and the `?filter=` deep link all
 * read the `categoryIds` the rows grew when a transaction joined
 * `BaseItem`.
 *
 * No `addItemFromSearch`, so the base falls back to `showCreateDialog`: a
 * transaction needs an amount and a date the search box cannot supply.
 * ───────────────────────────────────────────────────────────────── */
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { TRANSACTION_SORT_OPTIONS } from '../../model/transaction.types';
import { CashTransaction } from '../../model/transaction.types';
import { CashAccountsFacade } from '../accounts/cash-accounts.facade';
import { CashCategoriesFacade } from '../categories/cash-categories.facade';
import { CashTransactionsActions } from './cash-transactions.actions';
import { CashTransactionsFacade } from './cash-transactions.facade';
import {
  selectRoutedAccountId,
  selectRoutedAccountSearchResult,
  selectRoutedAccountTransactions,
  selectRoutedAccountTransactionsState,
} from './cash-transactions.selector';

@Injectable({ providedIn: 'root' })
export class CashAccountTransactionsPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #transactions = inject(CashTransactionsFacade);
  readonly #accounts = inject(CashAccountsFacade);
  readonly #categories = inject(CashCategoriesFacade);

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: CashTransactionsActions.updateSearch,
    updateSort: CashTransactionsActions.updateSort,
    updateFilter: CashTransactionsActions.updateFilter,
  });

  readonly accountId = this.#store.selectSignal(selectRoutedAccountId);

  readonly state = this.#store.selectSignal(
    selectRoutedAccountTransactionsState
  );
  readonly items = this.#store.selectSignal(selectRoutedAccountTransactions);
  readonly searchResult = this.#store.selectSignal(
    selectRoutedAccountSearchResult
  );

  readonly catalog = this.#categories.allItems;
  readonly sortOptions = signal(TRANSACTION_SORT_OPTIONS);

  readonly account = computed(() =>
    this.#accounts.allItems().find(({ id }) => id === this.accountId())
  );
  readonly heading = computed(() => this.account()?.name ?? '');
  readonly balanceCents = computed(
    () => this.#accounts.balances()[this.accountId()] ?? 0
  );
  readonly canImport = computed(() => !!this.account()?.bank);

  showCreateDialog(): void {
    this.#transactions.showCreateDialog(
      this.accountId(),
      this.state().filterBy
    );
  }

  showEditDialog(item: CashTransaction): void {
    this.#transactions.showEditDialog(item);
  }

  showEditAccountDialog(): void {
    const account = this.account();
    if (account) this.#accounts.showEditDialog(account);
  }

  manageCategories(): void {
    void this.#router.navigate(['/cash/categories']);
  }
}
