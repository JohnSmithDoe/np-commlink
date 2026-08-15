import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { CashState } from '../model/cash.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryNameLookup } from '../../@shared/util/categories/category.utils';
import { categoryIdOf } from '../util/cash-category.utils';
import { centsToEur } from '../util/money.utils';

const isReportable = (txn: CashTransaction): boolean =>
  !txn.isTransfer && !txn.matchedTxnId;

const addSignedAmount = (
  bucket: { incomeCents: number; spendCents: number },
  amountCents: number
): void => {
  if (amountCents > 0) bucket.incomeCents += amountCents;
  else bucket.spendCents += -amountCents;
};

export const CASH_STATE_KEY = 'cash';

export const selectCashState = createFeatureSelector<CashState>(CASH_STATE_KEY);

export const selectAllTransactions = createSelector(
  selectCashState,
  (state): CashTransaction[] => state.transactions.items
);

const selectAllAccounts = createSelector(
  selectCashState,
  (state) => state.accounts.items
);

export const selectAccountBalances = createSelector(
  selectAllAccounts,
  selectAllTransactions,
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

export const selectReportTotals = createSelector(
  selectAllTransactions,
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
  selectAllTransactions,
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
  selectCashState,
  (state) => {
    const byCategory = new Map<string, number>(); // key = categoryId or ''
    for (const txn of state.transactions.items) {
      if (!isReportable(txn) || txn.amountCents >= 0) continue; // outflows only
      const key = categoryIdOf(txn) ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + -txn.amountCents);
    }
    const categoryName = categoryNameLookup(state.categories.items);
    return [...byCategory.entries()]
      .map(([id, cents]) => ({ category: categoryName(id), cents }))
      .toSorted((a, b) => b.cents - a.cents);
  }
);

export const selectCashBalanceEuros = createSelector(
  selectNetWorthCents,
  (cents): number => Math.round(centsToEur(cents))
);
