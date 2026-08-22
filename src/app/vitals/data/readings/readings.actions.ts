import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { Reading } from '../../model/vitals.types';

export const ReadingsActions = createActionGroup({
  source: 'Vitals Readings',
  events: createItemListActionEvents<Reading>(),
});
