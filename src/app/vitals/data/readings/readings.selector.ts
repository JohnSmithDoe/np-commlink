import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import {
  ProfileSummary,
  Reading,
  ReadingsState,
} from '../../model/vitals.types';
import {
  byDateAscending,
  readingsOf,
  summaryFor,
} from '../../util/vitals.utils';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { selectReadingsList } from '../vitals.selector';

export const selectReadingItems = createSelector(
  selectReadingsList,
  (list): Reading[] => list.items
);

export const selectReadingsCount = createSelector(
  selectReadingItems,
  (readings): number => readings.length
);

export const selectRouteProfileReadings = createSelector(
  selectReadingItems,
  selectRouteEntityId,
  (readings, profileId): Reading[] =>
    profileId ? readingsOf(readings, profileId) : []
);

const selectRouteProfileList = createSelector(
  selectReadingsList,
  selectRouteProfileReadings,
  (list, items): ReadingsState => ({ ...list, items })
);

export const selectReadingsSearchResult = createSelector(
  selectRouteProfileList,
  (list): SearchResult<Reading> | undefined => filterListBySearchQuery(list)
);

export const selectReadingsListItems = createSelector(
  selectRouteProfileList,
  selectReadingsSearchResult,
  (list, result): Reading[] => filterAndSortItemList(list, result)
);

export const selectRouteProfileSummary = createSelector(
  selectRouteProfileReadings,
  (readings): ProfileSummary => summaryFor(readings)
);

export const selectRouteProfileSeries = createSelector(
  selectRouteProfileReadings,
  (readings): Reading[] => readings.toSorted(byDateAscending)
);
