import { createBaseItem } from '../../@shared/util/app.factory';
import { todayISO } from '../../@shared/util/formatting/date-format.utils';
import {
  ISODate,
  Profile,
  ProfilesState,
  PROFILES_LIST_ID,
  ProfileType,
  Reading,
  ReadingsState,
  READINGS_LIST_ID,
  VitalsId,
} from '../model/vitals.types';

export function createProfile(
  name: string,
  type: ProfileType = 'person'
): Profile {
  return { ...createBaseItem(name), type };
}

export function createReading(
  profileId: VitalsId,
  grams = 0,
  date: ISODate = todayISO()
): Reading {
  return { ...createBaseItem(date), profileId, grams };
}

export const initialProfilesState: ProfilesState = {
  id: PROFILES_LIST_ID,
  items: [],
  sort: { sortBy: 'name', sortDirection: 'asc' },
};

export const initialReadingsState: ReadingsState = {
  id: READINGS_LIST_ID,
  items: [],
  sort: { sortBy: 'name', sortDirection: 'desc' },
};
