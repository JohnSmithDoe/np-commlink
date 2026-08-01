import { createReducer, on } from '@ngrx/store';
import { IListSettings } from '../../model/list-settings.types';
import { GroceriesActions } from '../groceries/groceries.actions';
import { ListSettingsActions } from './list-settings.actions';

export const initialListSettings: IListSettings = {
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
  initialListSettings,
  on(
    ListSettingsActions.updateSettings,
    (_state, { settings }): IListSettings => settings
  ),
  on(
    GroceriesActions.loaded,
    (state, { data }): IListSettings => data?.listSettings ?? state
  )
);
