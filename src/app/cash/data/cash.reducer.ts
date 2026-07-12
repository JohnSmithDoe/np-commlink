import { createReducer, on } from '@ngrx/store';
import { ICashState, ICashTransaction } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { CashActions } from './cash.actions';

export const initialState: ICashState = {
  accounts: [],
  transactions: [],
  rules: [],
  categories: [],
};

/** Replace an entity with the same id, or append it if none matches. */
const upsertById = <T extends { id: string }>(
  list: readonly T[],
  entity: T
): T[] => {
  const index = list.findIndex((e) => e.id === entity.id);
  if (index === -1) return [...list, entity];
  const next = [...list];
  next[index] = entity;
  return next;
};

// prettier-ignore
export const cashReducer = createReducer(
  initialState,

  // ── Accounts ─────────────────────────────────────────────────
  on(CashActions.addAccount, (state, { account }): ICashState => ({ ...state, accounts: [...state.accounts, account] })),
  on(CashActions.updateAccount, (state, { account }): ICashState => ({ ...state, accounts: upsertById(state.accounts, account) })),
  on(CashActions.removeAccount, (state, { id }): ICashState => ({
    ...state,
    accounts: state.accounts.filter((a) => a.id !== id),
    // cascade: an account's transactions have no meaning without it
    transactions: state.transactions.filter((t) => t.accountId !== id),
  })),

  // ── Transactions ─────────────────────────────────────────────
  on(CashActions.addTransaction, (state, { transaction }): ICashState => ({ ...state, transactions: [...state.transactions, transaction] })),
  on(CashActions.updateTransaction, (state, { transaction }): ICashState => ({ ...state, transactions: upsertById(state.transactions, transaction) })),
  on(CashActions.removeTransaction, (state, { id }): ICashState => ({ ...state, transactions: state.transactions.filter((t) => t.id !== id) })),
  on(CashActions.setTransactionCategory, (state, { id, category, manual }): ICashState => ({
    ...state,
    transactions: state.transactions.map((t): ICashTransaction => t.id === id ? { ...t, category, categoryManual: manual } : t),
  })),

  // ── Categories ───────────────────────────────────────────────
  on(CashActions.addCategory, (state, { category }): ICashState => state.categories.includes(category) ? state : ({ ...state, categories: [...state.categories, category] })),
  on(CashActions.removeCategory, (state, { category }): ICashState => ({ ...state, categories: state.categories.filter((c) => c !== category) })),

  // ── Filter rules ─────────────────────────────────────────────
  on(CashActions.addRule, (state, { rule }): ICashState => ({ ...state, rules: [...state.rules, rule] })),
  on(CashActions.updateRule, (state, { rule }): ICashState => ({ ...state, rules: upsertById(state.rules, rule) })),
  on(CashActions.removeRule, (state, { id }): ICashState => ({ ...state, rules: state.rules.filter((r) => r.id !== id) })),
  on(CashActions.reorderRules, (state, { ids }): ICashState => ({
    ...state,
    rules: ids.flatMap((id, index) => {
      const rule = state.rules.find((r) => r.id === id);
      return rule ? [{ ...rule, order: index }] : [];
    }),
  })),

  on(ApplicationActions.loadedSuccessfully, (_state, { datastore }): ICashState => datastore.cash ?? _state),
);
