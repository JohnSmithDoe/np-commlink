import { createSelector } from '@ngrx/store';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { Pill, PillsState } from '../../model/vitals.types';
import { pillsOf } from '../../util/pill.utils';
import { selectPillsList } from '../vitals.selector';

export const selectPillItems = createSelector(
  selectPillsList,
  (list): Pill[] => list.items
);

export const selectRouteProfilePills = createSelector(
  selectPillItems,
  selectRouteEntityId,
  (pills, profileId): Pill[] => (profileId ? pillsOf(pills, profileId) : [])
);

const selectRouteProfileList = createSelector(
  selectPillsList,
  selectRouteProfilePills,
  (list, items): PillsState => ({ ...list, items })
);

export const selectPillsSearchResult = createSelector(
  selectRouteProfileList,
  (list): SearchResult<Pill> | undefined => filterListBySearchQuery(list)
);

export const selectPillsListItems = createSelector(
  selectRouteProfileList,
  selectPillsSearchResult,
  (list, result): Pill[] => filterAndSortItemList(list, result)
);
