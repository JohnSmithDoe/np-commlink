import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemDialogsActions } from '../../@shared/data/item-dialogs/item-dialogs.actions';
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
      title: 'Time tracking',
      items: [],
      categories: [],
      mode: 'alphabetical',
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
    expect(dispatch).toHaveBeenCalledWith(
      ItemDialogsActions.showCreateDialogWithSearch('_tracking')
    );
  });

  it('has no categories and its category ops are inert', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    expect(facade.categories()).toEqual([]);
    facade.addCategoryFromSearch();
    facade.setDisplayMode();
    facade.selectCategory();
    facade.deleteCategory();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
