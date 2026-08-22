import { createReducer, on } from '@ngrx/store';
import {
  addListItem,
  hydratedList,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { Pill, PillsState } from '../../model/vitals.types';
import { initialPillsState } from '../../util/vitals.factory';
import { VitalsActions } from '../vitals.actions';
import { PillsActions } from './pills.actions';

const withSlot = (state: PillsState, item: Pill): PillsState => {
  const next = addListItem<PillsState, Pill>(state, {
    ...item,
    slot: state.nextSlot,
  });
  return next === state ? state : { ...next, nextSlot: state.nextSlot + 1 };
};

// prettier-ignore
export const pillsReducer = createReducer(
  initialPillsState,

  on(PillsActions.addItem, (state, { item }): PillsState => withSlot(state, item)),
  on(PillsActions.updateItem, (state, { item }): PillsState => updateListItem(state, item)),
  on(PillsActions.removeItem, (state, { item }): PillsState => removeListItem(state, item)),
  on(PillsActions.updateSearch, (state, { searchQuery }): PillsState => updateListSearch(state, searchQuery)),
  on(PillsActions.updateSort, (state, { sortBy, sortDirection }): PillsState => updateListSort(state, sortBy, sortDirection)),

  on(VitalsActions.loaded, (state, { vitals }): PillsState => hydratedList({ ...initialPillsState, ...(vitals?.pills ?? state) }))
);
