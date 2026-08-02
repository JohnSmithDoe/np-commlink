import { createReducer, on } from '@ngrx/store';
import { ListSettings } from '../../model/list-settings.types';
import { HouseholdActions } from '../household.actions';
import { ListSettingsActions } from './list-settings.actions';

export const initialState: ListSettings = {
  showQuickAdd: false,
  showQuickAddProduct: false,
  showProductsInShopping: false,
  showProductsInStorage: false,
  showShoppingInProducts: false,
  showShoppingInStorage: false,
  showStorageInProducts: false,
  showStorageInShopping: false,
};

export const listSettingsReducer = createReducer(
  initialState,
  on(
    ListSettingsActions.updateSettings,
    (_state, { settings }): ListSettings => settings
  ),
  on(
    HouseholdActions.loaded,
    (state, { data }): ListSettings => data?.listSettings ?? state
  )
);
