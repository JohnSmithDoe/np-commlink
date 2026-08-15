import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import {
  CASH_ACCOUNTS_LIST_ID,
  CashAccountsState,
} from '../../model/cash.types';
import { CashActions } from '../cash.actions';
import { CashAccountsActions } from './cash-accounts.actions';

const initialAccountsState: CashAccountsState = {
  id: CASH_ACCOUNTS_LIST_ID,
  items: [],
};

// prettier-ignore
export const cashAccountsReducer = createReducer(
  initialAccountsState,
  on(CashAccountsActions.addItem, (state, { item }): CashAccountsState => addListItem(state, item)),
  on(CashAccountsActions.updateItem, (state, { item }): CashAccountsState => updateListItem(state, item)),
  on(CashAccountsActions.updateSearch, (state, { searchQuery }): CashAccountsState => updateListSearch(state, searchQuery)),
  on(CashAccountsActions.updateFilter, (state, { filterBy }): CashAccountsState => ({ ...state, filterBy })),
  on(CashAccountsActions.updateSort, (state, { sortBy, sortDirection }): CashAccountsState => updateListSort(state, sortBy, sortDirection)),

  on(CashActions.loaded, (state, { cash }): CashAccountsState => hydratedList(cash?.accounts ?? state))
);
