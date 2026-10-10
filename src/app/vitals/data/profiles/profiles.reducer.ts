import { createReducer, on } from '@ngrx/store';
import {
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { ProfilesState } from '../../model/vitals.types';
import { initialProfilesState } from '../../util/vitals.factory';
import { VitalsActions } from '../vitals.actions';
import { ProfilesActions } from './profiles.actions';

const asCurrentShape = (stored?: ProfilesState): ProfilesState => {
  if (!stored?.astro) return initialProfilesState;
  const { sort, astro, favoriteId } = stored;
  return { ...initialProfilesState, sort, astro, favoriteId };
};

// prettier-ignore
export const profilesReducer = createReducer(
  initialProfilesState,

  on(ProfilesActions.updateSearch, (state, { searchQuery }): ProfilesState => updateListSearch(state, searchQuery)),
  on(ProfilesActions.updateSort, (state, { sortBy, sortDirection }): ProfilesState => updateListSort(state, sortBy, sortDirection)),
  on(ProfilesActions.setAstro, (state, { id, astro }): ProfilesState => ({ ...state, astro: { ...state.astro, [id]: astro } })),
  on(ProfilesActions.setFavorite, (state, { id }): ProfilesState => ({ ...state, favoriteId: id })),

  on(VitalsActions.loaded, (state, { vitals }): ProfilesState => vitals ? asCurrentShape(vitals.profiles) : state)
);
