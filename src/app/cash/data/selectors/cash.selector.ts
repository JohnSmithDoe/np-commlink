import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { ICashState } from '../../model/cash.types';
import { ICashTransaction } from '../../model/transaction.types';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

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

export const selectCashState = createFeatureSelector<ICashState>('cash');

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
export const selectCashCategories = createSelector(
  selectCashState,
  (state) => state.categories
);

/**
 * The category catalog decorated with how many (live) transactions carry each
 * category, alphabetical by name — the shape the shared manage-categories page
 * binds to (`ICategoriesPageFacade.categories`). Reconciled-away legs
 * (`matchedTxnId`) are excluded so the count agrees with what the drill lists.
 */
export const selectCashCategoriesWithCount = createSelector(
  selectCashCategories,
  selectCashTransactions,
  (categories, transactions): { category: ICategory; count: number }[] => {
    const countById = new Map<string, number>();
    for (const txn of transactions) {
      if (txn.matchedTxnId || !txn.categoryId) continue;
      countById.set(txn.categoryId, (countById.get(txn.categoryId) ?? 0) + 1);
    }
    return categories
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        category,
        count: countById.get(category.id) ?? 0,
      }));
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
 * EXCLUDED so a reconciled spend is not double-counted — see docs/cash-plan.md.
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
      // Ignore orphan txns whose account no longer exists.
      if (balances[txn.accountId] === undefined) continue;
      balances[txn.accountId] += txn.amountCents;
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

// Net balance in whole euros across all accounts, for the deck's CREDSTICK
// tile. Transfer legs net to zero across accounts, so they need no
// special-casing; reconciled-away legs (matchedTxnId set) ARE excluded —
// mirroring selectAccountBalances — so a spend logged before it cleared isn't
// counted twice (cash-plan.md "exclude reconciled-away legs").
export const selectCashBalanceEuros = createSelector(
  selectCashState,
  (state) => {
    const opening = (state?.accounts ?? []).reduce(
      (sum, account) => sum + account.openingBalanceCents,
      0
    );
    const txns = (state?.transactions ?? [])
      .filter((txn) => !txn.matchedTxnId)
      .reduce((sum, txn) => sum + txn.amountCents, 0);
    return Math.round((opening + txns) / 100);
  }
);
