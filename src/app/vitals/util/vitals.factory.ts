import { IsoWeekday } from '../../@shared/model/app.types';
import { createBaseItem } from '../../@shared/util/app.factory';
import { todayISO } from '../../@shared/util/formatting/date-format.utils';
import {
  ISODate,
  IntakesState,
  Pill,
  PillsState,
  PILLS_LIST_ID,
  Profile,
  ProfilesState,
  PROFILES_LIST_ID,
  ProfileType,
  Reading,
  ReadingsState,
  READINGS_LIST_ID,
  VitalsId,
} from '../model/vitals.types';

export const EVERY_DAY: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

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

export function createPill(
  profileId: VitalsId,
  name = '',
  hour = 8,
  minute = 0
): Pill {
  return {
    ...createBaseItem(name),
    profileId,
    dose: 1,
    hour,
    minute,
    weekdays: [...EVERY_DAY],
    remind: true,
    slot: 0,
  };
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

export const initialPillsState: PillsState = {
  id: PILLS_LIST_ID,
  items: [],
  sort: { sortBy: 'name', sortDirection: 'asc' },
  nextSlot: 0,
};

export const initialIntakesState: IntakesState = [];
