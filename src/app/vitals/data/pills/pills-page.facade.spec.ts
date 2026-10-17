import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import {
  providePersonEditor,
  provideTestingProviders,
} from '../../../@shared/testing/test-providers';
import { PILLS_LIST_ID } from '../../model/vitals.types';
import {
  mockPillsState,
  mockVitalsState,
} from '../../testing/vitals.test-data';
import { PillsPageFacade } from './pills-page.facade';

describe('PillsPageFacade', () => {
  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('opens the create dialog seeded with the search query on enter', () => {
    const vitals = mockVitalsState({
      pills: mockPillsState([], { searchQuery: 'Ibuprofen' }),
    });
    TestBed.configureTestingModule({
      providers: [
        provideTestingProviders({ vitals }),
        providePersonEditor({ create: vi.fn() }),
      ],
    });
    TestBed.inject(MockStore).overrideSelector(selectRouteEntityId, 'p1');

    TestBed.inject(PillsPageFacade).addItemFromSearch();

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe(PILLS_LIST_ID);
    expect(request?.editMode).toBe('create');
    expect(request?.item.name).toBe('Ibuprofen');
  });
});
