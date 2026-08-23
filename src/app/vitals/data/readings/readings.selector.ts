import { createSelector } from '@ngrx/store';
import { createRouteScopedListSelectors } from '../../../@shared/data/item-lists/route-scoped-list.selector';
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
import { selectReadingsList } from '../vitals.selector';

const routeScoped = createRouteScopedListSelectors<Reading, ReadingsState>(
  selectReadingsList,
  readingsOf
);

export const selectReadingItems = routeScoped.selectItems;
export const selectRouteProfileReadings = routeScoped.selectScopedItems;
export const selectReadingsSearchResult = routeScoped.selectSearchResult;
export const selectReadingsListItems = routeScoped.selectListItems;

export const selectReadingsCount = createSelector(
  selectReadingItems,
  (readings): number => readings.length
);

export const selectRouteProfileSummary = createSelector(
  selectRouteProfileReadings,
  (readings): ProfileSummary => summaryFor(readings)
);

export const selectRouteProfileSeries = createSelector(
  selectRouteProfileReadings,
  (readings): Reading[] => readings.toSorted(byDateAscending)
);
