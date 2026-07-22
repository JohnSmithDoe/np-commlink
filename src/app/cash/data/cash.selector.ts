import { createFeatureSelector, createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import { ICategory, TCategoryId } from '../../@shared/types';
import { ICashState, ICashTransaction } from '../model';

// Reporting counts real income/expense only: transfers move money between own
// accounts (not spend/income) and a reconciled-away leg is a duplicate.
const isReportable = (t: ICashTransaction): boolean =>
  !t.isTransfer && !t.matchedTxnId;

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
    for (const t of transactions) {
      if (t.matchedTxnId || !t.categoryId) continue;
      countById.set(t.categoryId, (countById.get(t.categoryId) ?? 0) + 1);
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
      .filter((t) => t.categoryId === categoryId && !t.matchedTxnId)
      .toSorted((a, b) => {
        if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? 1 : -1;
        return a.id.localeCompare(b.id);
      })
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
    // survivor id -> the hidden manual leg reconciled into it
    const reconciledInto = new Map<string, string>();
    for (const t of transactions) {
      if (t.matchedTxnId) reconciledInto.set(t.matchedTxnId, t.id);
    }
    return transactions
      .filter((t) => t.accountId === accountId && !t.matchedTxnId)
      .map((t): TAccountTxn => ({
        ...t,
        reconciledManualId: reconciledInto.get(t.id),
      }))
      .toSorted((a, b) => {
        if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? 1 : -1;
        return a.id.localeCompare(b.id);
      });
  });

// ── Reporting (P5) ─────────────────────────────────────────────

/** Total income / spend / net across all reportable transactions. */
export const selectReportTotals = createSelector(
  selectCashTransactions,
  (transactions) => {
    let incomeCents = 0;
    let spendCents = 0;
    for (const t of transactions) {
      if (!isReportable(t)) continue;
      if (t.amountCents > 0) incomeCents += t.amountCents;
      else spendCents += -t.amountCents;
    }
    return { incomeCents, spendCents, netCents: incomeCents - spendCents };
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
    for (const t of transactions) {
      if (!isReportable(t)) continue;
      const month = dayjs(t.dateISO).format('YYYY-MM');
      const bucket = byMonth.get(month) ?? { incomeCents: 0, spendCents: 0 };
      if (t.amountCents > 0) bucket.incomeCents += t.amountCents;
      else bucket.spendCents += -t.amountCents;
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
    for (const t of transactions) {
      if (!isReportable(t) || t.amountCents >= 0) continue; // outflows only
      const key = t.categoryId ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + -t.amountCents);
    }
    const nameById = new Map(categories.map((c) => [c.id, c.name]));
    return [...byCategory.entries()]
      .map(([id, cents]) => ({
        category: id ? (nameById.get(id) ?? '') : '',
        cents,
      }))
      .toSorted((a, b) => b.cents - a.cents);
  }
);
