import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';
import {
  Profile,
  ProfilesState,
  Reading,
  ReadingsState,
  VitalsState,
} from '../model/vitals.types';
import {
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
    ...overrides,
  };
}
