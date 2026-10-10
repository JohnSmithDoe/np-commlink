import { createReducer, on } from '@ngrx/store';
import {
  addListItem,
  hydratedList,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../@shared/util/item-lists/list.utils';
import { PeopleState, Person } from '../model/people.types';
import { initialPeopleState } from '../util/people.factory';
import { PeopleActions } from './people.actions';

// prettier-ignore
export const peopleReducer = createReducer(
  initialPeopleState,

  on(PeopleActions.addItem, (state, { item }): PeopleState => addListItem(state, item)),
  on(PeopleActions.updateItem, (state, { item }): PeopleState => updateListItem(state, item)),
  on(PeopleActions.removeItem, (state, { item }): PeopleState => removeListItem<PeopleState, Person>(state, item)),
  on(PeopleActions.updateSearch, (state, { searchQuery }): PeopleState => updateListSearch(state, searchQuery)),
  on(PeopleActions.updateSort, (state, { sortBy, sortDirection }): PeopleState => updateListSort(state, sortBy, sortDirection)),

  on(PeopleActions.loaded, (state, { people }): PeopleState => hydratedList({ ...initialPeopleState, ...(people ?? state) }))
);
