/**
 * Public API of the `cash` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract (kept for specs,
 * the app-wide convention every domain's barrel follows), the two page
 * facades, the `TAccountTxn` view type and the lazy context bundle, and
 * nothing else. The reducer, the initial state, and every selector are
 * module internals and stay hidden: importing them from outside `cash/data`
 * is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { CashActions } from './actions/cash.actions';
export type { TAccountTxn } from './selectors/cash.selector';

export { CashFacade } from './cash.facade';
export { CashCategoriesPageFacade } from './cash-categories-page.facade';

export { cashContext } from './cash.providers';
