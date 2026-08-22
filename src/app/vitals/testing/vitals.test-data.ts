import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';
import {
  Pill,
  PillsState,
  Profile,
  ProfilesState,
  Reading,
  ReadingsState,
  VitalsState,
} from '../model/vitals.types';
import {
  EVERY_DAY,
  initialIntakesState,
  initialPillsState,
  initialProfilesState,
  initialReadingsState,
} from '../util/vitals.factory';

export function mockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    name: 'Martin',
    type: 'person',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockReading(overrides: Partial<Reading> = {}): Reading {
  return {
    id: 'reading-1',
    name: '2026-08-21',
    profileId: 'profile-1',
    grams: 78_400,
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockPill(overrides: Partial<Pill> = {}): Pill {
  return {
    id: 'pill-1',
    name: 'Ibuprofen 400',
    profileId: 'profile-1',
    dose: 1,
    hour: 8,
    minute: 0,
    weekdays: [...EVERY_DAY],
    remind: true,
    slot: 0,
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockPillsState(
  items: Pill[] = [],
  overrides: Partial<PillsState> = {}
): PillsState {
  return { ...initialPillsState, items, ...overrides };
}

export function mockProfilesState(
  items: Profile[] = [],
  overrides: Partial<ProfilesState> = {}
): ProfilesState {
  return { ...initialProfilesState, items, ...overrides };
}

export function mockReadingsState(
  items: Reading[] = [],
  overrides: Partial<ReadingsState> = {}
): ReadingsState {
  return { ...initialReadingsState, items, ...overrides };
}

export function mockVitalsState(
  overrides: Partial<VitalsState> = {}
): VitalsState {
  return {
    profiles: mockProfilesState(),
    readings: mockReadingsState(),
    pills: mockPillsState(),
    intakes: initialIntakesState,
    ...overrides,
  };
}
