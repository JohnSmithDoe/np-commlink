import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { Profile, ProfileSummary, VitalsId } from '../../model/vitals.types';
import { favoriteAmong, readingsOf, summaryFor } from '../../util/vitals.utils';
import { selectReadingItems } from '../readings/readings.selector';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { selectProfilesList } from '../vitals.selector';

export const selectProfileItems = createSelector(
  selectProfilesList,
  (list): Profile[] => list.items
);

export const selectPersonProfiles = createSelector(
  selectProfileItems,
  (profiles): Profile[] =>
    profiles.filter((profile) => profile.type === 'person')
);

export const selectFavoriteProfile = createSelector(
  selectPersonProfiles,
  (persons): Profile | undefined => favoriteAmong(persons)
);

export const selectProfilesSearchResult = createSelector(
  selectProfilesList,
  (list): SearchResult<Profile> | undefined => filterListBySearchQuery(list)
);

export const selectProfilesListItems = createSelector(
  selectProfilesList,
  selectProfilesSearchResult,
  (list, result): Profile[] => filterAndSortItemList(list, result)
);

export const selectRouteProfile = createSelector(
  selectProfileItems,
  selectRouteEntityId,
  (profiles, profileId): Profile | undefined =>
    profiles.find((profile) => profile.id === profileId)
);

export const selectProfileSummaries = createSelector(
  selectProfileItems,
  selectReadingItems,
  (profiles, readings): Record<VitalsId, ProfileSummary> =>
    Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        summaryFor(readingsOf(readings, profile.id)),
      ])
    )
);
