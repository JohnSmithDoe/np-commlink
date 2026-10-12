import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { PEOPLE_LIST_ID } from '../model/people.types';
import { mockPeopleState } from '../testing/people.test-data';
import { PeoplePageFacade } from './people-page.facade';

describe('PeoplePageFacade', () => {
  it('opens the create dialog seeded with the search query on enter', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({
          people: mockPeopleState([], { searchQuery: 'Ronja' }),
        }),
      ],
    });
    const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');

    TestBed.inject(PeoplePageFacade).addItemFromSearch();

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe(PEOPLE_LIST_ID);
    expect(request?.editMode).toBe('create');
    expect(request?.item.name).toBe('Ronja');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
