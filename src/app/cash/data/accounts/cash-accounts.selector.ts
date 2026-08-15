import { createSelector } from '@ngrx/store';
import { CashAccount } from '../../model/account.types';
import { CashAccountsState } from '../../model/cash.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { SearchResult } from '../../../@shared/model/item-list.types';
import { selectAccountBalances, selectCashState } from '../cash.selector';

export const selectAccountsState = createSelector(
  selectCashState,
  (state): CashAccountsState => state.accounts
);

export const selectAccountItems = createSelector(
  selectAccountsState,
  (state): CashAccount[] => state.items
);

export const selectAccountsSearchResult = createSelector(
  selectAccountsState,
  (state): SearchResult<CashAccount> | undefined =>
    filterListBySearchQuery(state)
);

const selectAccountsListItems = createSelector(
  selectAccountsState,
  selectAccountsSearchResult,
  (state, result): CashAccount[] => filterAndSortItemList(state, result)
);

export type AccountWithBalance = CashAccount & { balanceCents: number };

export const selectAccountsWithBalances = createSelector(
  selectAccountsListItems,
  selectAccountBalances,
  (accounts, balances): AccountWithBalance[] =>
    accounts.map((account) => ({
      ...account,
      balanceCents: balances[account.id] ?? account.openingBalanceCents,
    }))
);

export const selectAccountById = (accountId: string) =>
  createSelector(selectAccountItems, (accounts) =>
    accounts.find((account) => account.id === accountId)
  );
