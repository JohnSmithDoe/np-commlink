/* ─── why ─────────────────────────────────────────────────────────
 * `removeItem` lives in `cashCascade`, not here. Deleting one leg of a
 * transfer takes the other with it — a decision this reducer could make,
 * but the cascade has to see the same action, and `combineReducers`
 * returns the identical object when no sub-reducer changed anything.
 * Handling it in both places would show the cascade the post-delete list.
 * ───────────────────────────────────────────────────────────────── */
import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import {
  CASH_TRANSACTIONS_LIST_ID,
  CashTransactionsState,
} from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import { categoryIdOf, withCategory } from '../../util/cash-category.utils';
import { ImportConfirmation } from '../../util/import/plan-import';
import { CashActions } from '../cash.actions';
import { CashTransactionsActions } from './cash-transactions.actions';

const initialTransactionsState: CashTransactionsState = {
  id: CASH_TRANSACTIONS_LIST_ID,
  items: [],
  sort: { sortBy: 'dateISO', sortDirection: 'desc' },
};

const withItems = (
  state: CashTransactionsState,
  items: CashTransaction[]
): CashTransactionsState => ({ ...state, items });

const booked = (
  items: readonly CashTransaction[],
  confirmed: readonly ImportConfirmation[]
): CashTransaction[] => {
  if (confirmed.length === 0) return [...items];
  const byId = new Map(confirmed.map((entry) => [entry.id, entry]));
  return items.map((txn): CashTransaction => {
    const entry = byId.get(txn.id);
    return entry
      ? {
          ...txn,
          status: 'confirmed',
          importKey: entry.importKey,
          dateISO: entry.dateISO,
        }
      : txn;
  });
};

// prettier-ignore
export const cashTransactionsReducer = createReducer(
  initialTransactionsState,
  on(CashTransactionsActions.addItem, (state, { item }): CashTransactionsState => addListItem(state, item)),
  on(CashTransactionsActions.updateItem, (state, { item }): CashTransactionsState => updateListItem(state, item)),
  on(CashTransactionsActions.updateSearch, (state, { searchQuery }): CashTransactionsState => updateListSearch(state, searchQuery)),
  on(CashTransactionsActions.updateFilter, (state, { filterBy }): CashTransactionsState => ({ ...state, filterBy })),
  on(CashTransactionsActions.updateSort, (state, { sortBy, sortDirection }): CashTransactionsState => updateListSort(state, sortBy, sortDirection)),

  on(CashTransactionsActions.importItems, (state, { items, confirmed }): CashTransactionsState =>
    withItems(state, [...booked(state.items, confirmed), ...items])),

  on(CashTransactionsActions.bookTransfer, (state, { fromLeg, toLeg }): CashTransactionsState =>
    withItems(state, [...state.items, fromLeg, toLeg])),

  on(CashTransactionsActions.recategorize, (state, { changes }): CashTransactionsState => {
    const assigned = new Map(changes.map((change) => [change.transactionId, change.categoryId]));
    return withItems(state, state.items.map((txn): CashTransaction =>
      assigned.has(txn.id)
        ? { ...withCategory(txn, assigned.get(txn.id)), categoryManual: false }
        : txn
    ));
  }),

  on(CashTransactionsActions.reconcile, (state, { manualId, importedId }): CashTransactionsState => {
    const manual = state.items.find((txn) => txn.id === manualId);
    const imported = state.items.find((txn) => txn.id === importedId);
    if (!manual || !imported) return state;
    const carry = manual.categoryManual && categoryIdOf(manual) && !imported.categoryManual;
    return withItems(state, state.items.map((txn): CashTransaction => {
      if (txn.id === manualId) return { ...txn, matchedTxnId: importedId, status: 'confirmed' };
      if (txn.id === importedId && carry)
        return { ...withCategory(txn, categoryIdOf(manual)), categoryManual: true };
      return txn;
    }));
  }),

  on(CashTransactionsActions.unreconcile, (state, { manualId }): CashTransactionsState =>
    withItems(state, state.items.map((txn): CashTransaction =>
      txn.id === manualId ? { ...txn, matchedTxnId: undefined, status: 'pending' } : txn
    ))),

  on(CashActions.loaded, (state, { cash }): CashTransactionsState => hydratedList(cash?.transactions ?? state))
);
