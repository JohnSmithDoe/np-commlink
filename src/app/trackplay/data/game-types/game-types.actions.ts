import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { GameType } from '../../model/trackplay.types';

export const GameTypesActions = createActionGroup({
  source: 'Trackplay GameTypes',
  events: createItemListActionEvents<GameType>(),
});
