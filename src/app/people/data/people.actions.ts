import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { PeopleState, Person } from '../model/people.types';

export const PeopleActions = createActionGroup({
  source: 'People',
  events: {
    load: emptyProps(),
    loaded: (people: PeopleState | null) => ({ people }),
    ...createItemListActionEvents<Person>(),
  },
});
