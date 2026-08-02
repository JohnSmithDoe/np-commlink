import { createReducer, on } from '@ngrx/store';
import { CASH_CATEGORIES_LIST_ID, CashState } from '../model/cash.types';
import {
  addToCatalog,
  removeFromCatalog,
  renameInCatalog,
} from '../../@shared/util/categories/category-list.utils';
import {
  updateListSearch,
  updateListSort,
  withList,
} from '../../@shared/util/item-lists/list.utils';
import { CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';
import { CashActions } from './cash.actions';

export const initialState: CashState = {
  accounts: [],
  transactions: [],
  rules: [],
  categories: { id: CASH_CATEGORIES_LIST_ID, items: [] },
};

const upsertById = <T extends { id: string }>(
  list: readonly T[],
  entity: T
): T[] => {
  const index = list.findIndex((candidate) => candidate.id === entity.id);
  if (index === -1) return [...list, entity];
  const next = [...list];
  next[index] = entity;
  return next;
};

// prettier-ignore
const withoutOrphanRules = (cash: CashState): CashState => {
  const known = new Set(cash.categories.items.map((entry) => entry.id));
  const rules = cash.rules.filter((rule) => known.has(rule.categoryId));
  return rules.length === cash.rules.length ? cash : { ...cash, rules };
};

export const cashReducer = createReducer(
  initialState,

  on(CashActions.addAccount, (state, { account }): CashState => ({
    ...state,
    accounts: [...state.accounts, account],
  })),
  on(CashActions.updateAccount, (state, { account }): CashState => ({
    ...state,
    accounts: upsertById(state.accounts, account),
  })),
  on(CashActions.removeAccount, (state, { id }): CashState => ({
    ...state,
    accounts: state.accounts.filter((a) => a.id !== id),
    transactions: state.transactions.filter((t) => t.accountId !== id),
  })),

  on(CashActions.addTransaction, (state, { transaction }): CashState => ({
    ...state,
    transactions: [...state.transactions, transaction],
  })),
  on(CashActions.updateTransaction, (state, { transaction }): CashState => ({
    ...state,
    transactions: upsertById(state.transactions, transaction),
  })),
  on(CashActions.removeTransaction, (state, { id }): CashState => {
    const groupId = state.transactions.find(
      (t) => t.id === id
    )?.transferGroupId;
    return {
      ...state,
      transactions: state.transactions.filter((t) =>
        groupId ? t.transferGroupId !== groupId : t.id !== id
      ),
    };
  }),
  on(CashActions.importTransactions, (state, { transactions }): CashState => ({
    ...state,
    transactions: [...state.transactions, ...transactions],
  })),
  on(CashActions.bookTransfer, (state, { fromLeg, toLeg }): CashState => ({
    ...state,
    transactions: [...state.transactions, fromLeg, toLeg],
  })),
  on(
    CashActions.setTransactionCategory,
    (state, { id, categoryId, manual }): CashState => ({
      ...state,
      transactions: state.transactions.map((t): CashTransaction =>
        t.id === id ? { ...t, categoryId, categoryManual: manual } : t
      ),
    })
  ),
  on(CashActions.recategorizeTransactions, (state, { changes }): CashState => {
    const assigned = new Map(
      changes.map((c) => [c.transactionId, c.categoryId])
    );
    return {
      ...state,
      transactions: state.transactions.map((t): CashTransaction =>
        assigned.has(t.id)
          ? { ...t, categoryId: assigned.get(t.id), categoryManual: false }
          : t
      ),
    };
  }),
  on(
    CashActions.reconcileTransaction,
    (state, { manualId, importedId }): CashState => {
      const manual = state.transactions.find((t) => t.id === manualId);
      const imported = state.transactions.find((t) => t.id === importedId);
      if (!manual || !imported) return state;
      const carry =
        manual.categoryManual && manual.categoryId && !imported.categoryManual;
      return {
        ...state,
        transactions: state.transactions.map((t): CashTransaction => {
          if (t.id === manualId)
            return { ...t, matchedTxnId: importedId, status: 'confirmed' };
          if (t.id === importedId && carry)
            return {
              ...t,
              categoryId: manual.categoryId,
              categoryManual: true,
            };
          return t;
        }),
      };
    }
  ),
  on(CashActions.unreconcileTransaction, (state, { manualId }): CashState => ({
    ...state,
    transactions: state.transactions.map((t): CashTransaction =>
      t.id === manualId
        ? { ...t, matchedTxnId: undefined, status: 'pending' }
        : t
    ),
  })),

  on(CashActions.addCategory, (state, { category }): CashState =>
    withList(state, 'categories', addToCatalog(state.categories, category))
  ),
  on(CashActions.updateCategorySearch, (state, { searchQuery }): CashState => ({
    ...state,
    categories: updateListSearch(state.categories, searchQuery),
  })),
  on(
    CashActions.updateCategorySort,
    (state, { sortBy, sortDirection }): CashState => ({
      ...state,
      categories: {
        ...state.categories,
        sort: updateListSort(
          sortBy,
          sortDirection,
          state.categories.sort?.sortDirection
        ),
      },
    })
  ),

  on(CashActions.removeCategory, (state, { id }): CashState => ({
    ...state,
    categories: removeFromCatalog(state.categories, id),
    rules: state.rules.filter((rule) => rule.categoryId !== id),
    transactions: state.transactions.map((t): CashTransaction =>
      t.categoryId === id
        ? { ...t, categoryId: undefined, categoryManual: undefined }
        : t
    ),
  })),
  on(CashActions.updateCategory, (state, { id, name }): CashState => {
    const { catalog, mergedInto } = renameInCatalog(state.categories, id, name);
    if (!mergedInto) return { ...state, categories: catalog };
    return {
      ...state,
      categories: catalog,
      transactions: state.transactions.map((t): CashTransaction =>
        t.categoryId === id ? { ...t, categoryId: mergedInto } : t
      ),
      rules: state.rules.map((r): CashRule =>
        r.categoryId === id ? { ...r, categoryId: mergedInto } : r
      ),
    };
  }),

  on(CashActions.addRule, (state, { rule }): CashState => ({
    ...state,
    rules: [...state.rules, rule],
  })),
  on(CashActions.updateRule, (state, { rule }): CashState => ({
    ...state,
    rules: upsertById(state.rules, rule),
  })),
  on(CashActions.removeRule, (state, { id }): CashState => ({
    ...state,
    rules: state.rules.filter((r) => r.id !== id),
  })),
  on(CashActions.reorderRules, (state, { ids }): CashState => {
    const byId = new Map(state.rules.map((rule) => [rule.id, rule]));
    const reordered = ids.flatMap((id, index) => {
      const rule = byId.get(id);
      if (!rule) return [];
      byId.delete(id);
      return [{ ...rule, order: index }];
    });
    const untouched = [...byId.values()].map((rule, index) => ({
      ...rule,
      order: reordered.length + index,
    }));
    return { ...state, rules: [...reordered, ...untouched] };
  }),

  on(CashActions.loaded, (_state, { cash }): CashState =>
    cash ? withoutOrphanRules(cash) : _state
  )
);
