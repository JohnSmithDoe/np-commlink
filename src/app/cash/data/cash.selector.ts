import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { ICashState } from '../model/cash.types';
import { ICashTransaction } from '../model/transaction.types';
import { categoryNameLookup } from '../../@shared/util/categories/category.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import { centsToEur } from '../util/money.utils';
import {
  ICategory,
  ICategoryList,
  TCategoryId,
} from '../../@shared/model/category.types';
import { ISearchResult } from '../../@shared/model/item-list.types';

// Reporting counts real income/expense only: transfers move money between own
// accounts (not spend/income) and a reconciled-away leg is a duplicate.
const isReportable = (txn: ICashTransaction): boolean =>
  !txn.isTransfer && !txn.matchedTxnId;

// Newest first, with the id as a stable tiebreak so equal-dated rows keep a
// deterministic order across recomputes.
const byNewestFirst = (a: ICashTransaction, b: ICashTransaction): number =>
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

export const selectCashState =
  createFeatureSelector<ICashState>(CASH_STATE_KEY);

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
// The catalog as a list (the catalog page binds this) and as its entries (every
// picker, lookup and drill binds these).
export const selectCashCategoryList = createSelector(
  selectCashState,
  (state): ICategoryList => state.categories
);
export const selectCashCategories = createSelector(
  selectCashCategoryList,
  (catalog): ICategory[] => catalog.items
);

export const selectCashCategoriesSearchResult = createSelector(
  selectCashCategoryList,
  (catalog): ISearchResult<ICategory> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectCashCategoriesListItems = createSelector(
  selectCashCategoryList,
  selectCashCategoriesSearchResult,
  (catalog, result): ICategory[] | undefined =>
    filterAndSortItemList(catalog, result)
);

/**
 * How many live transactions carry each category — a lookup the catalog row reads,
 * where it used to be a decorated-and-sorted catalog (the sort is the list page's
 * job now). Reconciled-away legs (`matchedTxnId`) are excluded so the count agrees
 * with what the drill lists.
 *
 * Not the shared `itemCountByCategory`: a cash transaction carries ONE scalar
 * `categoryId`, not the `categoryIds[]` every other domain's items have.
 */
export const selectCashCountByCategory = createSelector(
  selectCashTransactions,
  (transactions): Map<TCategoryId, number> => {
    const countById = new Map<TCategoryId, number>();
    for (const txn of transactions) {
      if (txn.matchedTxnId || !txn.categoryId) continue;
      countById.set(txn.categoryId, (countById.get(txn.categoryId) ?? 0) + 1);
    }
    return countById;
  }
);

/**
 * A category's transactions for the category→items drill: every live txn
 * carrying `categoryId`, newest first (`dateISO` desc, `id` tiebreak), excluding
 * reconciled-away legs. Mirrors {@link selectTransactionsForAccount}, keyed by
 * category instead of account.
 */
export const selectTransactionsForCategory = (categoryId: TCategoryId) =>
  createSelector(selectCashTransactions, (transactions): ICashTransaction[] =>
    transactions
      .filter((txn) => txn.categoryId === categoryId && !txn.matchedTxnId)
      .toSorted(byNewestFirst)
  );

/**
 * Running balance per account: `openingBalanceCents + Σ signed amountCents`,
 * keyed by account id. Order-independent (a plain sum). Legs carrying a
 * `matchedTxnId` (a pending manual entry merged into an imported txn) are
 * EXCLUDED so a reconciled spend is not double-counted — see docs/cash.md §7.3.
 */
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
      // Ignore orphan txns whose account no longer exists.
      if (running === undefined) continue;
      balances[txn.accountId] = running + txn.amountCents;
    }
    return balances;
  }
);

/** Net worth = Σ account balances (a credit-card debt nets in as negative). */
export const selectNetWorthCents = createSelector(
  selectAccountBalances,
  (balances): number =>
    Object.values(balances).reduce((sum, cents) => sum + cents, 0)
);

/** Accounts decorated with their running balance, for the overview list. */
export const selectAccountsWithBalances = createSelector(
  selectCashAccounts,
  selectAccountBalances,
  (accounts, balances) =>
    accounts.map((account) => ({
      ...account,
      balanceCents: balances[account.id] ?? account.openingBalanceCents,
    }))
);

/** A single account by id (undefined once it has been removed). */
export const selectAccountById = (accountId: string) =>
  createSelector(selectCashAccounts, (accounts) =>
    accounts.find((a) => a.id === accountId)
  );

/** A display transaction, decorated with the id of the hidden manual leg (if
 *  any) that was reconciled into it — the account page's "detach" affordance. */
export type TAccountTxn = ICashTransaction & { reconciledManualId?: string };

/**
 * An account's transactions for display: newest first (`dateISO` desc, `id` as a
 * stable tiebreak), excluding reconciled-away legs (`matchedTxnId` set) so the
 * list agrees with the running balance. Each surviving txn is tagged with
 * `reconciledManualId` when a hidden manual leg points at it, so the UI can
 * offer to detach (un-reconcile) it. Copies before sorting — never mutates.
 */
export const selectTransactionsForAccount = (accountId: string) =>
  createSelector(selectCashTransactions, (transactions): TAccountTxn[] => {
    const manualLegBySurvivorId = new Map<string, string>();
    for (const txn of transactions) {
      if (txn.matchedTxnId) manualLegBySurvivorId.set(txn.matchedTxnId, txn.id);
    }
    return transactions
      .filter((txn) => txn.accountId === accountId && !txn.matchedTxnId)
      .map((txn): TAccountTxn => ({
        ...txn,
        reconciledManualId: manualLegBySurvivorId.get(txn.id),
      }))
      .toSorted(byNewestFirst);
  });

// ── Reporting (P5) ─────────────────────────────────────────────

/** Total income / spend / net across all reportable transactions. */
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

/** Income + spend bucketed by month (`YYYY-MM`), oldest first. */
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

/** Spending grouped by category (outflows only), largest first. Groups by
 *  category id, then resolves the display name against the catalog. Uncategorized
 *  spend (no id) collects under the empty-name key. */
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

/**
 * Net balance in whole euros, for the deck's CREDSTICK tile.
 *
 * Derived from `selectNetWorthCents` rather than re-summing the slice, because
 * the two answers disagreed: a per-account sum skips transactions whose account
 * no longer exists, while summing the transaction list flat counted them. So an
 * orphaned txn made the tile report a different figure from the accounts list it
 * links to. There is one sum now, and the per-account one is authoritative — a
 * deleted account's money is not part of the net worth.
 *
 * Rounding to whole euros stays here: it is what the tile shows, not what the
 * ledger holds.
 */
export const selectCashBalanceEuros = createSelector(
  selectNetWorthCents,
  (cents): number => Math.round(centsToEur(cents))
);
