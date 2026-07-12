import { createReducer, on } from '@ngrx/store';
import { IListSettings } from '../../types';
import { ApplicationActions } from '../application.actions';
import { ListSettingsActions } from './list-settings.actions';

export const VERSION: string = '1';

export const initialListSettings: IListSettings = {
  showQuickAdd: false,
  showQuickAddGlobal: false,
  showQuickAddCategory: false,
  showGlobalsInShopping: false,
  showGlobalsInStorage: false,
  showShoppingInGlobals: false,
  showShoppingInStorage: false,
  showStorageInGlobals: false,
  showStorageInShopping: false,
  version: VERSION,
};

export const listSettingsReducer = createReducer(
  initialListSettings,
  on(
    ListSettingsActions.updateSettings,
    (_state, { settings }): IListSettings => settings
  ),
  on(
    ApplicationActions.loadedSuccessfully,
    (_state, { datastore }): IListSettings => datastore.listSettings ?? _state
  )
);
