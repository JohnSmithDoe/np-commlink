import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import { PersonId } from '../../@shared/model/person.types';
import {
  IntakesState,
  Pill,
  PillsState,
  VitalsState,
} from '../model/vitals.types';

export const deletePillCascade = (
  state: VitalsState,
  pill: Pill
): VitalsState => ({
  ...state,
  pills: removeListItem<PillsState, Pill>(state.pills, pill),
  intakes: state.intakes.filter((intake) => intake.pillId !== pill.id),
});

export const restorePillCascade = (
  state: VitalsState,
  pill: Pill,
  intakes: IntakesState
): VitalsState => ({
  ...state,
  pills: addListItem<PillsState, Pill>(state.pills, pill),
  intakes: [...state.intakes, ...intakes],
});

const isLive =
  (people: ReadonlySet<PersonId>) =>
  (item: { profileId: PersonId }): boolean =>
    people.has(item.profileId);

export const hasOrphans = (
  state: VitalsState,
  people: ReadonlySet<PersonId>
): boolean =>
  !state.readings.items.every(isLive(people)) ||
  !state.pills.items.every(isLive(people)) ||
  Object.keys(state.profiles.astro).some((id) => !people.has(id)) ||
  (state.profiles.favoriteId !== undefined &&
    !people.has(state.profiles.favoriteId));

export const sweepOrphans = (
  state: VitalsState,
  people: ReadonlySet<PersonId>
): VitalsState => {
  const pills = state.pills.items.filter(isLive(people));
  const pillIds = new Set(pills.map((pill) => pill.id));
  const { astro, favoriteId } = state.profiles;
  return {
    profiles: {
      ...state.profiles,
      astro: Object.fromEntries(
        Object.entries(astro).filter(([id]) => people.has(id))
      ),
      favoriteId:
        favoriteId !== undefined && people.has(favoriteId)
          ? favoriteId
          : undefined,
    },
    readings: {
      ...state.readings,
      items: state.readings.items.filter(isLive(people)),
    },
    pills: { ...state.pills, items: pills },
    intakes: state.intakes.filter((intake) => pillIds.has(intake.pillId)),
  };
};
