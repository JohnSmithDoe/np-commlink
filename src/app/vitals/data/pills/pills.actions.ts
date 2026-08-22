import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { ISODate, Pill, VitalsId } from '../../model/vitals.types';

export const PillsActions = createActionGroup({
  source: 'Vitals Pills',
  events: {
    ...createItemListActionEvents<Pill>(),
    setTaken: (pillId: VitalsId, takenOn: ISODate, taken: boolean) => ({
      pillId,
      takenOn,
      taken,
    }),
  },
});
