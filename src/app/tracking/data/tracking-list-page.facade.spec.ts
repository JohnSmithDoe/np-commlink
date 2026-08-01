import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { TrackingActions } from './tracking.actions';
import {
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
} from './tracking.selector';
import { TrackingListPageFacade } from './tracking-list-page.facade';

describe('TrackingListPageFacade', () => {
  let store: MockStore;
  let facade: TrackingListPageFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    // Seed the tracking selectors the facade reads so its signal fields resolve
    // without a real reducer state.
    store.overrideSelector(selectTrackingState, {
      items: [],
      categories: [],
    } as never);
    store.overrideSelector(selectTrackingListItems, []);
    store.overrideSelector(selectTrackingListSearchResult, undefined);
    facade = TestBed.inject(TrackingListPageFacade);
  });

  afterEach(() => store.resetSelectors());

  it('dispatches a search update', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    facade.search('milk');
    expect(dispatch).toHaveBeenCalledWith(TrackingActions.updateSearch('milk'));
  });

  it('toggles the sort mode', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    facade.setSortMode('name');
    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.updateSort('name', 'toggle')
    );
  });

  it('dispatches add-from-search and opens the shared create dialog on _tracking', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    facade.addItemFromSearch();
    facade.showCreateDialog();
    expect(dispatch).toHaveBeenCalledWith(TrackingActions.addItemFromSearch());
    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.listId).toBe('_tracking');
    expect(request?.editMode).toBe('create');
  });

  // createByTicket used to round-trip through TrackingActions.showCreateByTicket
  // and an effect purely to build a seed item; it opens the host directly now.
  it('opens a create dialog seeded with a fresh ticket', () => {
    facade.createByTicket();
    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.editMode).toBe('create');
    expect(request?.item.name).toBe('new ticket');
  });

  it('has no categories, so its one category op is inert', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    facade.selectCategory();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
