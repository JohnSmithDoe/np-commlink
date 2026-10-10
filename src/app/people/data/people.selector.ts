import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchResult } from '../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import { PeopleState, Person } from '../model/people.types';

export const PEOPLE_STATE_KEY = 'people';

export const selectPeopleState =
  createFeatureSelector<PeopleState>(PEOPLE_STATE_KEY);

export const selectPersonItems = createSelector(
  selectPeopleState,
  (list): Person[] => list.items
);

export const selectPeopleSearchResult = createSelector(
  selectPeopleState,
  (list): SearchResult<Person> | undefined => filterListBySearchQuery(list)
);

export const selectPeopleListItems = createSelector(
  selectPeopleState,
  selectPeopleSearchResult,
  (list, result): Person[] => filterAndSortItemList(list, result)
);

export const selectPeopleCount = createSelector(
  selectPersonItems,
  (people): number => people.length
);
