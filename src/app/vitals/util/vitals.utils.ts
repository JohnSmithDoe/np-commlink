import {
  ISODate,
  Profile,
  ProfileSummary,
  Reading,
  VitalsId,
} from '../model/vitals.types';

export const withSoleFavorite = (
  profiles: readonly Profile[],
  favoriteId: VitalsId
): Profile[] =>
  profiles.map(({ favorite, ...profile }) =>
    profile.id === favoriteId ? { ...profile, favorite: true } : profile
  );

export const favoriteAmong = (
  persons: readonly Profile[]
): Profile | undefined =>
  persons.find((person) => person.favorite) ??
  (persons.length === 1 ? persons[0] : undefined);

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
  const previous = byDate.at(-2);
  if (!latest) return { count: 0 };
  return {
    count: readings.length,
    latestGrams: latest.grams,
    deltaGrams: previous ? latest.grams - previous.grams : undefined,
  };
}
