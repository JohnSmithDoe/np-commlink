import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ICashState } from '../../@shared/types';

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
