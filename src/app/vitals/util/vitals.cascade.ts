import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import {
  Profile,
  ProfilesState,
  Reading,
  VitalsState,
} from '../model/vitals.types';

export const deleteProfileCascade = (
  state: VitalsState,
  profile: Profile
): VitalsState => ({
  ...state,
  profiles: removeListItem<ProfilesState, Profile>(state.profiles, profile),
  readings: {
    ...state.readings,
    items: state.readings.items.filter(
      (reading) => reading.profileId !== profile.id
    ),
  },
});

export const restoreProfileCascade = (
  state: VitalsState,
  profile: Profile,
  readings: readonly Reading[]
): VitalsState => ({
  ...state,
  profiles: addListItem<ProfilesState, Profile>(state.profiles, profile),
  readings: {
    ...state.readings,
    items: [...readings, ...state.readings.items],
  },
});
