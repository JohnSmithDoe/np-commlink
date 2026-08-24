import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { Profile, VitalsId } from '../../model/vitals.types';

export const ProfilesActions = createActionGroup({
  source: 'Vitals Profiles',
  events: {
    ...createItemListActionEvents<Profile>(),
    setFavorite: (id: VitalsId) => ({ id }),
  },
});
