import { createItemListEffects } from '../../@shared/data/item-lists/item-list.effects.factory';
import { PEOPLE_LIST_ID } from '../model/people.types';
import { PeopleActions } from './people.actions';
import { selectPeopleState } from './people.selector';

export const peopleListEffects = createItemListEffects({
  actions: PeopleActions,
  select: selectPeopleState,
  create: null,
  undoableDelete: {
    scope: PEOPLE_LIST_ID,
    removeItem: PeopleActions.removeItem,
  },
});
