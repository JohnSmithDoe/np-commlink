/**
 * Public API of the `cash` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the display
 * selectors, and the lazy providers, and nothing else. The reducer, effects,
 * load/save/telemetry effects, initial state, and the raw feature selector
 * are module internals and stay hidden: importing them from outside
 * `cash/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { CashActions } from './cash.actions';

export {
  selectCashAccounts,
  selectCashTransactions,
  selectCashCategories,
  selectCashCategoriesWithCount,
  selectCashRules,
  selectAccountBalances,
  selectAccountById,
  selectTransactionsForAccount,
  selectTransactionsForCategory,
  selectAccountsWithBalances,
  selectNetWorthCents,
  selectMonthlyTotals,
  selectReportTotals,
  selectSpendByCategory,
} from './cash.selector';
export type { TAccountTxn } from './cash.selector';

export { CashFacade } from './cash.facade';
export { CashCategoriesPageFacade } from './cash-categories-page.facade';

export { cashLazyProviders, cashHydrationResolver } from './provide-cash-lazy';
