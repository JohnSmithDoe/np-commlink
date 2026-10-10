import { createSelector } from '@ngrx/store';
import { PersonId } from '../../../@shared/model/person.types';
import {
  AstroOverride,
  ProfileSummary,
  VitalsId,
} from '../../model/vitals.types';
import { summariesByProfile } from '../../util/vitals.utils';
import { selectReadingItems } from '../readings/readings.selector';
import { selectProfilesList } from '../vitals.selector';

export const selectAstroOverrides = createSelector(
  selectProfilesList,
  (list): Record<PersonId, AstroOverride> => list.astro
);

export const selectFavoriteId = createSelector(
  selectProfilesList,
  (list): PersonId | undefined => list.favoriteId
);

export const selectProfileSummaries = createSelector(
  selectReadingItems,
  (readings): Record<VitalsId, ProfileSummary> => summariesByProfile(readings)
);
