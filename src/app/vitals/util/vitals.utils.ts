import { PersonId, PersonRef } from '../../@shared/model/person.types';
import {
  AstroOverride,
  ISODate,
  Profile,
  ProfileSummary,
  Reading,
  VitalsId,
} from '../model/vitals.types';

export const profilesOf = (
  people: readonly PersonRef[],
  astro: Readonly<Record<PersonId, AstroOverride>>
): Profile[] => people.map((person) => ({ ...person, ...astro[person.id] }));

export const favoriteAmong = <T extends PersonRef>(
  persons: readonly T[],
  favoriteId?: PersonId
): T | undefined => {
  return (
    persons.find((person) => person.id === favoriteId) ??
    (persons.length === 1 ? persons[0] : undefined)
  );
};

export const summariesByProfile = (
  readings: readonly Reading[]
): Record<VitalsId, ProfileSummary> => {
  const profileIds = new Set(readings.map((reading) => reading.profileId));
  return Object.fromEntries(
    [...profileIds].map((id) => [id, summaryFor(readingsOf(readings, id))])
  );
};

export const readingsOf = (
  readings: readonly Reading[],
  profileId: VitalsId
): Reading[] => readings.filter((reading) => reading.profileId === profileId);

export const byDateAscending = (a: Reading, b: Reading): number =>
  a.name.localeCompare(b.name);

export const readingOn = (
  readings: readonly Reading[],
  profileId: VitalsId,
  date: ISODate
): Reading | undefined =>
  readingsOf(readings, profileId).find((reading) => reading.name === date);

export const nearestReadingUpTo = (
  readings: readonly Reading[],
  profileId: VitalsId,
  date: ISODate
): Reading | undefined => {
  let nearest: Reading | undefined;
  for (const reading of readings) {
    if (reading.profileId !== profileId || reading.name > date) continue;
    if (!nearest || reading.name > nearest.name) nearest = reading;
  }
  return nearest;
};

export function summaryFor(readings: readonly Reading[]): ProfileSummary {
  const byDate = readings.toSorted(byDateAscending);
  const latest = byDate.at(-1);
  if (!latest) return { count: 0 };
  const previous = byDate.at(-2);
  return {
    count: readings.length,
    latestGrams: latest.grams,
    deltaGrams: previous ? latest.grams - previous.grams : undefined,
  };
}
