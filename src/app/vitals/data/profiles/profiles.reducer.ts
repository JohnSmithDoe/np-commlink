import { createReducer, on } from '@ngrx/store';
import {
  addListItem,
  hydratedList,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { ProfilesState } from '../../model/vitals.types';
import { initialProfilesState } from '../../util/vitals.factory';
import { withSoleFavorite } from '../../util/vitals.utils';
import { VitalsActions } from '../vitals.actions';
import { ProfilesActions } from './profiles.actions';

// prettier-ignore
export const profilesReducer = createReducer(
  initialProfilesState,

  on(ProfilesActions.addItem, (state, { item }): ProfilesState => addListItem(state, item)),
  on(ProfilesActions.updateItem, (state, { item }): ProfilesState => updateListItem(state, item)),
  on(ProfilesActions.updateSearch, (state, { searchQuery }): ProfilesState => updateListSearch(state, searchQuery)),
  on(ProfilesActions.updateSort, (state, { sortBy, sortDirection }): ProfilesState => updateListSort(state, sortBy, sortDirection)),
  on(ProfilesActions.setFavorite, (state, { id }): ProfilesState => ({ ...state, items: withSoleFavorite(state.items, id) })),

  on(VitalsActions.loaded, (state, { vitals }): ProfilesState => hydratedList({ ...initialProfilesState, ...(vitals?.profiles ?? state) }))
);
