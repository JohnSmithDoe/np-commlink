/* ─── why ─────────────────────────────────────────────────────────
 * `combineReducers` returns the IDENTICAL state when no sub-reducer
 * changed anything, so a cascade below sees the PRE-action slices if and
 * only if no per-aggregate reducer handled that action. Every action here
 * is therefore absent from its own aggregate's reducer, deliberately —
 * splitting one across both halves would make the cascade read a list the
 * aggregate had already rewritten. Neither the compiler nor a
 * single-aggregate test can see that, so `cash.reducer.spec.ts` asserts
 * each cascade end to end.
 *
 * `withoutOrphanRules` runs on `loaded` rather than on delete: a rule
 * whose category is gone is unreachable, not wrong, and a document
 * written before the cascade existed can still hold one.
 * ───────────────────────────────────────────────────────────────── */
import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import {
  dropCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from '../../@shared/util/categories/category-list.utils';
import { removeListItem } from '../../@shared/util/item-lists/list.utils';
import { CashState } from '../model/cash.types';
import { CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryIdOf } from '../util/cash-category.utils';
import { CashAccountsActions } from './accounts/cash-accounts.actions';
import { cashAccountsReducer } from './accounts/cash-accounts.reducer';
import { cashCategoriesReducer } from './categories/cash-categories.reducer';
import { CashCategoriesActions } from './categories/cash-categories.actions';
import { cashRulesReducer } from './rules/cash-rules.reducer';
import { CashTransactionsActions } from './transactions/cash-transactions.actions';
import { cashTransactionsReducer } from './transactions/cash-transactions.reducer';
import { CashActions } from './cash.actions';

const perAggregate = combineReducers<CashState>({
  accounts: cashAccountsReducer,
  transactions: cashTransactionsReducer,
  rules: cashRulesReducer,
  categories: cashCategoriesReducer,
});

const withTransactions = (
  state: CashState,
  items: CashTransaction[]
): CashState => ({
  ...state,
  transactions: { ...state.transactions, items },
});

const withRules = (state: CashState, items: CashRule[]): CashState => ({
  ...state,
  rules: { ...state.rules, items },
});

const forgetManualWhenUncategorized = (
  txn: CashTransaction
): CashTransaction =>
  categoryIdOf(txn) ? txn : { ...txn, categoryManual: undefined };

const withoutOrphanRules = (state: CashState): CashState => {
  const known = new Set(state.categories.items.map((entry) => entry.id));
  const items = state.rules.items.filter((rule) => known.has(rule.categoryId));
  return items.length === state.rules.items.length
    ? state
    : withRules(state, items);
};

// prettier-ignore
const cashCascade = createReducer(
  {} as CashState,

  on(CashAccountsActions.removeItem, (state, { item }): CashState => ({
    ...withTransactions(state, state.transactions.items.filter((txn) => txn.accountId !== item.id)),
    accounts: removeListItem(state.accounts, item),
  })),

  on(CashTransactionsActions.removeItem, (state, { item }): CashState => {
    const groupId = state.transactions.items.find((txn) => txn.id === item.id)?.transferGroupId;
    return withTransactions(state, state.transactions.items.filter((txn) =>
      groupId ? txn.transferGroupId !== groupId : txn.id !== item.id
    ));
  }),

  on(CashCategoriesActions.removeItem, (state, { item }): CashState => ({
    ...withRules(
      withTransactions(
        state,
        dropCategoryRef(state.transactions.items, item.id).map((txn) => forgetManualWhenUncategorized(txn))
      ),
      state.rules.items.filter((rule) => rule.categoryId !== item.id)
    ),
    categories: removeFromCatalog(state.categories, item.id),
  })),

  on(CashCategoriesActions.updateItem, (state, { item }): CashState => {
    const { catalog, mergedInto } = renameInCatalog(state.categories, item.id, item.name ?? '');
    const next = mergedInto
      ? withRules(
          withTransactions(state, remapCategoryRef(state.transactions.items, item.id, mergedInto)),
          state.rules.items.map((rule): CashRule =>
            rule.categoryId === item.id ? { ...rule, categoryId: mergedInto } : rule
          )
        )
      : state;
    return { ...next, categories: catalog };
  }),

  on(CashActions.loaded, (state): CashState => withoutOrphanRules(state))
);

export const cashReducer = (
  state: CashState | undefined,
  action: Action
): CashState => cashCascade(perAggregate(state, action), action);
