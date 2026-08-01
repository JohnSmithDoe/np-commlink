import { createReducer, on } from '@ngrx/store';
import { CASH_CATEGORIES_LIST_ID, ICashState } from '../model/cash.types';
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
import { ICashRule } from '../model/rule.types';
import { ICashTransaction } from '../model/transaction.types';
import { CashActions } from './cash.actions';

export const initialState: ICashState = {
  accounts: [],
  transactions: [],
  rules: [],
  categories: { id: CASH_CATEGORIES_LIST_ID, items: [] },
};

/** Replace an entity with the same id, or append it if none matches. */
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
const withoutOrphanRules = (cash: ICashState): ICashState => {
  const known = new Set(cash.categories.items.map((entry) => entry.id));
  const rules = cash.rules.filter((rule) => known.has(rule.categoryId));
  return rules.length === cash.rules.length ? cash : { ...cash, rules };
};

export const cashReducer = createReducer(
  initialState,

  // ── Accounts ─────────────────────────────────────────────────
  on(CashActions.addAccount, (state, { account }): ICashState => ({
    ...state,
    accounts: [...state.accounts, account],
  })),
  on(CashActions.updateAccount, (state, { account }): ICashState => ({
    ...state,
    accounts: upsertById(state.accounts, account),
  })),
  on(CashActions.removeAccount, (state, { id }): ICashState => ({
    ...state,
    accounts: state.accounts.filter((a) => a.id !== id),
    // cascade: an account's transactions have no meaning without it
    transactions: state.transactions.filter((t) => t.accountId !== id),
  })),

  // ── Transactions ─────────────────────────────────────────────
  on(CashActions.addTransaction, (state, { transaction }): ICashState => ({
    ...state,
    transactions: [...state.transactions, transaction],
  })),
  on(CashActions.updateTransaction, (state, { transaction }): ICashState => ({
    ...state,
    transactions: upsertById(state.transactions, transaction),
  })),
  on(CashActions.removeTransaction, (state, { id }): ICashState => {
    // Deleting either leg of a transfer removes the whole group.
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
  on(CashActions.importTransactions, (state, { transactions }): ICashState => ({
    ...state,
    transactions: [...state.transactions, ...transactions],
  })),
  on(CashActions.bookTransfer, (state, { fromLeg, toLeg }): ICashState => ({
    ...state,
    transactions: [...state.transactions, fromLeg, toLeg],
  })),
  on(
    CashActions.setTransactionCategory,
    (state, { id, categoryId, manual }): ICashState => ({
      ...state,
      transactions: state.transactions.map((t): ICashTransaction =>
        t.id === id ? { ...t, categoryId, categoryManual: manual } : t
      ),
    })
  ),
  on(CashActions.recategorizeTransactions, (state, { changes }): ICashState => {
    const assigned = new Map(
      changes.map((c) => [c.transactionId, c.categoryId])
    );
    return {
      ...state,
      transactions: state.transactions.map((t): ICashTransaction =>
        assigned.has(t.id)
          ? { ...t, categoryId: assigned.get(t.id), categoryManual: false }
          : t
      ),
    };
  }),
  on(
    CashActions.reconcileTransaction,
    (state, { manualId, importedId }): ICashState => {
      const manual = state.transactions.find((t) => t.id === manualId);
      const imported = state.transactions.find((t) => t.id === importedId);
      if (!manual || !imported) return state;
      // Carry a hand-set category from the manual leg onto the survivor so the
      // user's categorization isn't lost when the manual leg is hidden.
      const carry =
        manual.categoryManual && manual.categoryId && !imported.categoryManual;
      return {
        ...state,
        transactions: state.transactions.map((t): ICashTransaction => {
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
  on(CashActions.unreconcileTransaction, (state, { manualId }): ICashState => ({
    // Detach only restores the manual leg to pending/visible; any category the
    // reconcile carried onto the survivor stays (it's now the survivor's own).
    ...state,
    transactions: state.transactions.map((t): ICashTransaction =>
      t.id === manualId
        ? { ...t, matchedTxnId: undefined, status: 'pending' }
        : t
    ),
  })),

  // ── Categories ───────────────────────────────────────────────
  on(CashActions.addCategory, (state, { category }): ICashState =>
    withList(state, 'categories', addToCatalog(state.categories, category))
  ),
  on(
    CashActions.updateCategorySearch,
    (state, { searchQuery }): ICashState => ({
      ...state,
      categories: updateListSearch(state.categories, searchQuery),
    })
  ),
  on(
    CashActions.updateCategorySort,
    (state, { sortBy, sortDirection }): ICashState => ({
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

  // Delete by id: drop the catalog entry, clear it off any transaction (→
  // uncategorized), and drop the rules that assigned it. A rule cannot outlive
  // its category — `ICashRule.categoryId` is required, the rules page renders an
  // orphan with a blank category so it cannot be repaired by hand, and
  // "Regeln anwenden" would otherwise stamp the dead id straight back onto the
  // transactions this same handler just cleared.
  on(CashActions.removeCategory, (state, { id }): ICashState => ({
    ...state,
    categories: removeFromCatalog(state.categories, id),
    rules: state.rules.filter((rule) => rule.categoryId !== id),
    transactions: state.transactions.map((t): ICashTransaction =>
      t.categoryId === id
        ? { ...t, categoryId: undefined, categoryManual: undefined }
        : t
    ),
  })),
  // Rename by id — O(1): txns/rules reference the id, so only the catalog entry's
  // name changes. Renaming onto an existing name MERGES: drop the renamed entry
  // and remap txn + rule references onto the survivor id.
  on(CashActions.updateCategory, (state, { id, name }): ICashState => {
    const { catalog, mergedInto } = renameInCatalog(state.categories, id, name);
    if (!mergedInto) return { ...state, categories: catalog };
    return {
      ...state,
      categories: catalog,
      transactions: state.transactions.map((t): ICashTransaction =>
        t.categoryId === id ? { ...t, categoryId: mergedInto } : t
      ),
      rules: state.rules.map((r): ICashRule =>
        r.categoryId === id ? { ...r, categoryId: mergedInto } : r
      ),
    };
  }),

  // ── Filter rules ─────────────────────────────────────────────
  on(CashActions.addRule, (state, { rule }): ICashState => ({
    ...state,
    rules: [...state.rules, rule],
  })),
  on(CashActions.updateRule, (state, { rule }): ICashState => ({
    ...state,
    rules: upsertById(state.rules, rule),
  })),
  on(CashActions.removeRule, (state, { id }): ICashState => ({
    ...state,
    rules: state.rules.filter((r) => r.id !== id),
  })),
  on(CashActions.reorderRules, (state, { ids }): ICashState => {
    const byId = new Map(state.rules.map((rule) => [rule.id, rule]));
    // `ids` is expected to name every rule; a rule it omits is kept, not
    // dropped, so a stale/partial payload can't silently delete rules.
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

  // Self-heal on hydration: documents written before `removeCategory` cascaded
  // can hold rules pointing at a category that is gone.
  on(CashActions.loaded, (_state, { cash }): ICashState =>
    cash ? withoutOrphanRules(cash) : _state
  )
);
