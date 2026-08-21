/* ─── why ─────────────────────────────────────────────────────────
 * Transactions are ONE collection seen through two route-scoped views,
 * not two collections, so scoping narrows a derived `ItemList` and hands
 * that to the shared pair rather than filtering their output.
 *
 * Order matters: `filterListBySearchQuery` reads `state.items`, so scoping
 * BEFORE it is what makes the searchbar mean "within this account" and the
 * "n of m" count this account's rows. After it, the search would cover the
 * whole ledger and then hide most of what it found.
 *
 * `filterBy` stays free for the user-armed chip, which is why the route's
 * category is not written into it.
 *
 * A ledger has ONE order, so `scopedTo` overwrites `sort` rather than the
 * toolbar offering it. Dropping the buttons alone would not pin anything:
 * `itemComparator` falls back to `compareByName` when `sort` is absent, so
 * the ledger would read reverse-alphabetically and no control could fix it.
 * Overwriting here also makes whatever a previous version persisted inert.
 * ───────────────────────────────────────────────────────────────── */
import { createSelector } from '@ngrx/store';
import { selectRouteParams as selectRouteParameters } from '../../../@shared/data/router/router.selector';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  ItemListSort,
  SearchResult,
} from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { CashTransactionsState } from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import { categoryIdOf } from '../../util/cash-category.utils';
import { selectCashState } from '../cash.selector';

const selectTransactionsState = createSelector(
  selectCashState,
  (state): CashTransactionsState => state.transactions
);

export type AccountTransaction = CashTransaction & {
  reconciledManualId?: string;
};

const NEWEST_FIRST: ItemListSort = {
  sortBy: 'dateISO',
  sortDirection: 'desc',
};

const scopedTo = (
  state: CashTransactionsState,
  keep: (txn: CashTransaction) => boolean
): CashTransactionsState => ({
  ...state,
  items: state.items.filter((txn) => keep(txn)),
  sort: NEWEST_FIRST,
});

const withReconciledLeg = (
  items: CashTransaction[],
  all: readonly CashTransaction[]
): AccountTransaction[] => {
  const manualLegBySurvivorId = new Map<string, string>();
  for (const txn of all) {
    if (txn.matchedTxnId) manualLegBySurvivorId.set(txn.matchedTxnId, txn.id);
  }
  return items.map((txn) => ({
    ...txn,
    reconciledManualId: manualLegBySurvivorId.get(txn.id),
  }));
};

export const selectRoutedAccountId = createSelector(
  selectRouteParameters,
  (parameters): string => (parameters?.['accountId'] as string) ?? ''
);

export const selectRoutedCategoryId = createSelector(
  selectRouteParameters,
  (parameters): CategoryId => (parameters?.['categoryId'] as string) ?? ''
);

export const selectRoutedAccountTransactionsState = createSelector(
  selectTransactionsState,
  selectRoutedAccountId,
  (state, accountId) =>
    scopedTo(state, (txn) => txn.accountId === accountId && !txn.matchedTxnId)
);

export const selectRoutedAccountSearchResult = createSelector(
  selectRoutedAccountTransactionsState,
  (state): SearchResult<CashTransaction> | undefined =>
    filterListBySearchQuery(state)
);

export const selectRoutedAccountTransactions = createSelector(
  selectTransactionsState,
  selectRoutedAccountTransactionsState,
  selectRoutedAccountSearchResult,
  (all, scoped, result): AccountTransaction[] =>
    withReconciledLeg(filterAndSortItemList(scoped, result), all.items)
);

export const selectRoutedCategoryTransactionsState = createSelector(
  selectTransactionsState,
  selectRoutedCategoryId,
  (state, categoryId) =>
    scopedTo(
      state,
      (txn) => categoryIdOf(txn) === categoryId && !txn.matchedTxnId
    )
);

export const selectRoutedCategorySearchResult = createSelector(
  selectRoutedCategoryTransactionsState,
  (state): SearchResult<CashTransaction> | undefined =>
    filterListBySearchQuery(state)
);

export const selectRoutedCategoryTransactions = createSelector(
  selectRoutedCategoryTransactionsState,
  selectRoutedCategorySearchResult,
  (state, result): CashTransaction[] => filterAndSortItemList(state, result)
);
