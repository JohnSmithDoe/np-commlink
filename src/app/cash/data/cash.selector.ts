import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { CashState } from '../model/cash.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryNameLookup } from '../../@shared/util/categories/category.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import { centsToEur } from '../util/money.utils';
import {
  Category,
  CategoryId,
  CategoryList,
} from '../../@shared/model/category.types';
import { SearchResult } from '../../@shared/model/item-list.types';

const isReportable = (txn: CashTransaction): boolean =>
  !txn.isTransfer && !txn.matchedTxnId;

const byNewestFirst = (a: CashTransaction, b: CashTransaction): number =>
  a.dateISO === b.dateISO
    ? a.id.localeCompare(b.id)
    : a.dateISO < b.dateISO
      ? 1
      : -1;

const addSignedAmount = (
  bucket: { incomeCents: number; spendCents: number },
  amountCents: number
): void => {
  if (amountCents > 0) bucket.incomeCents += amountCents;
  else bucket.spendCents += -amountCents;
};

export const CASH_STATE_KEY = 'cash';

export const selectCashState = createFeatureSelector<CashState>(CASH_STATE_KEY);

export const selectCashAccounts = createSelector(
  selectCashState,
  (state) => state.accounts
);
export const selectCashTransactions = createSelector(
  selectCashState,
  (state) => state.transactions
);
export const selectCashRules = createSelector(
  selectCashState,
  (state) => state.rules
);
export const selectCashCategoryList = createSelector(
  selectCashState,
  (state): CategoryList => state.categories
);
export const selectCashCategories = createSelector(
  selectCashCategoryList,
  (catalog): Category[] => catalog.items
);

export const selectCashCategoriesSearchResult = createSelector(
  selectCashCategoryList,
  (catalog): SearchResult<Category> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectCashCategoriesListItems = createSelector(
  selectCashCategoryList,
  selectCashCategoriesSearchResult,
  (catalog, result): Category[] | undefined =>
    filterAndSortItemList(catalog, result)
);

export const selectCashCountByCategory = createSelector(
  selectCashTransactions,
  (transactions): Map<CategoryId, number> => {
    const countById = new Map<CategoryId, number>();
    for (const txn of transactions) {
      if (txn.matchedTxnId || !txn.categoryId) continue;
      countById.set(txn.categoryId, (countById.get(txn.categoryId) ?? 0) + 1);
    }
    return countById;
  }
);

export const selectTransactionsForCategory = (categoryId: CategoryId) =>
  createSelector(selectCashTransactions, (transactions): CashTransaction[] =>
    transactions
      .filter((txn) => txn.categoryId === categoryId && !txn.matchedTxnId)
      .toSorted(byNewestFirst)
  );

export const selectAccountBalances = createSelector(
  selectCashAccounts,
  selectCashTransactions,
  (accounts, transactions): Record<string, number> => {
    const balances: Record<string, number> = {};
    for (const account of accounts) {
      balances[account.id] = account.openingBalanceCents;
    }
    for (const txn of transactions) {
      if (txn.matchedTxnId) continue;
      const running = balances[txn.accountId];
      if (running === undefined) continue;
      balances[txn.accountId] = running + txn.amountCents;
    }
    return balances;
  }
);

export const selectNetWorthCents = createSelector(
  selectAccountBalances,
  (balances): number =>
    Object.values(balances).reduce((sum, cents) => sum + cents, 0)
);

export const selectAccountsWithBalances = createSelector(
  selectCashAccounts,
  selectAccountBalances,
  (accounts, balances) =>
    accounts.map((account) => ({
      ...account,
      balanceCents: balances[account.id] ?? account.openingBalanceCents,
    }))
);

export const selectAccountById = (accountId: string) =>
  createSelector(selectCashAccounts, (accounts) =>
    accounts.find((a) => a.id === accountId)
  );

export type AccountTransaction = CashTransaction & {
  reconciledManualId?: string;
};

export const selectTransactionsForAccount = (accountId: string) =>
  createSelector(
    selectCashTransactions,
    (transactions): AccountTransaction[] => {
      const manualLegBySurvivorId = new Map<string, string>();
      for (const txn of transactions) {
        if (txn.matchedTxnId)
          manualLegBySurvivorId.set(txn.matchedTxnId, txn.id);
      }
      return transactions
        .filter((txn) => txn.accountId === accountId && !txn.matchedTxnId)
        .map((txn): AccountTransaction => ({
          ...txn,
          reconciledManualId: manualLegBySurvivorId.get(txn.id),
        }))
        .toSorted(byNewestFirst);
    }
  );

export const selectReportTotals = createSelector(
  selectCashTransactions,
  (transactions) => {
    const totals = { incomeCents: 0, spendCents: 0 };
    for (const txn of transactions) {
      if (!isReportable(txn)) continue;
      addSignedAmount(totals, txn.amountCents);
    }
    return { ...totals, netCents: totals.incomeCents - totals.spendCents };
  }
);

export const selectMonthlyTotals = createSelector(
  selectCashTransactions,
  (transactions) => {
    const byMonth = new Map<
      string,
      { incomeCents: number; spendCents: number }
    >();
    for (const txn of transactions) {
      if (!isReportable(txn)) continue;
      const month = dayjs(txn.dateISO).format('YYYY-MM');
      const bucket = byMonth.get(month) ?? { incomeCents: 0, spendCents: 0 };
      addSignedAmount(bucket, txn.amountCents);
      byMonth.set(month, bucket);
    }
    return [...byMonth.entries()]
      .map(([month, totals]) => ({ month, ...totals }))
      .toSorted((a, b) => (a.month < b.month ? -1 : 1));
  }
);

export const selectSpendByCategory = createSelector(
  selectCashTransactions,
  selectCashCategories,
  (transactions, categories) => {
    const byCategory = new Map<string, number>(); // key = categoryId or ''
    for (const txn of transactions) {
      if (!isReportable(txn) || txn.amountCents >= 0) continue; // outflows only
      const key = txn.categoryId ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + -txn.amountCents);
    }
    const categoryName = categoryNameLookup(categories);
    return [...byCategory.entries()]
      .map(([id, cents]) => ({ category: categoryName(id), cents }))
      .toSorted((a, b) => b.cents - a.cents);
  }
);

export const selectCashBalanceEuros = createSelector(
  selectNetWorthCents,
  (cents): number => Math.round(centsToEur(cents))
);
