import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { Player } from '../../model/trackplay.types';

export const PlayersActions = createActionGroup({
  source: 'Trackplay Players',
  events: createItemListActionEvents<Player>(),
});
