import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CashState } from '../model/cash.types';
import { CashTransaction } from '../model/transaction.types';
import { centsToEur } from '../util/money.utils';

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

export const selectAllowanceBalanceCents = createSelector(
  selectAllAccounts,
  selectAccountBalances,
  (accounts, balances): number => {
    let total = 0;
    for (const account of accounts) {
      if (account.excludedFromAllowance) continue;
      total += balances[account.id] ?? 0;
    }
    return total;
  }
);

export const selectAllowanceTransactions = createSelector(
  selectAllAccounts,
  selectAllTransactions,
  (accounts, transactions): CashTransaction[] => {
    const excluded = new Set(
      accounts
        .filter((account) => account.excludedFromAllowance)
        .map((account) => account.id)
    );
    return transactions.filter((txn) => !excluded.has(txn.accountId));
  }
);

export const selectCashBalanceEuros = createSelector(
  selectNetWorthCents,
  (cents): number => Math.round(centsToEur(cents))
);
