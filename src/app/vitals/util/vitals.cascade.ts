import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import {
  IntakesState,
  Pill,
  PillsState,
  Profile,
  ProfilesState,
  Reading,
  VitalsState,
} from '../model/vitals.types';

export const deleteProfileCascade = (
  state: VitalsState,
  profile: Profile
): VitalsState => {
  const doomedPills = new Set(
    state.pills.items
      .filter((pill) => pill.profileId === profile.id)
      .map((pill) => pill.id)
  );
  return {
    ...state,
    profiles: removeListItem<ProfilesState, Profile>(state.profiles, profile),
    readings: {
      ...state.readings,
      items: state.readings.items.filter(
        (reading) => reading.profileId !== profile.id
      ),
    },
    pills: {
      ...state.pills,
      items: state.pills.items.filter((pill) => !doomedPills.has(pill.id)),
    },
    intakes: state.intakes.filter((intake) => !doomedPills.has(intake.pillId)),
  };
};

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

export const restoreProfileCascade = (
  state: VitalsState,
  profile: Profile,
  readings: readonly Reading[],
  pills: readonly Pill[],
  intakes: IntakesState
): VitalsState => ({
  ...state,
  profiles: addListItem<ProfilesState, Profile>(state.profiles, profile),
  readings: {
    ...state.readings,
    items: [...readings, ...state.readings.items],
  },
  pills: {
    ...state.pills,
    items: [...pills, ...state.pills.items],
  },
  intakes: [...state.intakes, ...intakes],
});
