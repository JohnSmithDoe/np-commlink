import { createReducer, on } from '@ngrx/store';
import { IGlobalsState } from '../../@shared/types';
import {
  addListCategory,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from '../../@shared/data/grocery-list/grocery-list.utils';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { GlobalsActions } from './globals.actions';

export const initialState: IGlobalsState = {
  title: 'Global Items',
  id: '_globals',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

function updateSearch(
  state: IGlobalsState,
  searchQuery?: string
): IGlobalsState {
  searchQuery = searchQuery?.trim();
  if (searchQuery === state.searchQuery) return state;
  return { ...state, searchQuery };
}

// prettier-ignore
export const globalsReducer = createReducer(
  initialState,
  on(GlobalsActions.addItem,(state, { item }) => addListItem(state, item)),
  on(GlobalsActions.removeItem,(state, { item }) => removeListItem(state, item)),
  on(GlobalsActions.updateItem,(state, { item }) => updateListItem(state, item)),
  on(GlobalsActions.updateSearch,(state, { searchQuery }): IGlobalsState => updateSearch(state, searchQuery)),
  on(GlobalsActions.updateFilter,(state, { filterBy }): IGlobalsState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(GlobalsActions.updateMode, (state, { mode }) => updateListMode(state, mode)),
  on(GlobalsActions.updateSort, (state, { sortBy, sortDir }) => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(GlobalsActions.addCategory, (state, { category }) =>  addListCategory(state, category)),
  on(GlobalsActions.removeCategory, (state, { category }) => removeListCategory(state, category)),
  on(GlobalsActions.updateCategory, (state, { original, newName }) => updateListCategory(state, original, newName)),

  on(ApplicationActions.loadedSuccessfully,(_state, { datastore }): IGlobalsState => {
    return {...(datastore.globals ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
