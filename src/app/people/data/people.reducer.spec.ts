import { initialPeopleState } from '../util/people.factory';
import { mockPeopleState, mockPerson } from '../testing/people.test-data';
import { PeopleActions } from './people.actions';
import { peopleReducer } from './people.reducer';

const ann = mockPerson({ id: 'ann', name: 'Ann' });

describe('peopleReducer', () => {
  it('adds, updates and removes a person by id', () => {
    const added = peopleReducer(initialPeopleState, PeopleActions.addItem(ann));
    const updated = peopleReducer(
      added,
      PeopleActions.updateItem({ ...ann, sizes: { shoe: 38 } })
    );
    const removed = peopleReducer(updated, PeopleActions.removeItem(ann));

    expect(updated.items).toEqual([{ ...ann, sizes: { shoe: 38 } }]);
    expect(removed.items).toEqual([]);
  });

  it('drops the transient search on hydration', () => {
    const state = peopleReducer(
      initialPeopleState,
      PeopleActions.loaded(mockPeopleState([ann], { searchQuery: 'an' }))
    );

    expect(state.items).toEqual([ann]);
    expect(state.searchQuery).toBeUndefined();
  });
});
