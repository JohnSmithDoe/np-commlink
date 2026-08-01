import { createSelector } from '@ngrx/store';
import { IListSettings } from '../../model/list-settings.types';
import { selectGroceriesState } from '../groceries/groceries.selector';

export const selectListSettingsState = createSelector(
  selectGroceriesState,
  (state): IListSettings => state.listSettings
);
