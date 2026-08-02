import { createSelector } from '@ngrx/store';
import { ListSettings } from '../../model/list-settings.types';
import { selectHouseholdState } from '../household.selector';

export const selectListSettingsState = createSelector(
  selectHouseholdState,
  (state): ListSettings => state.listSettings
);
