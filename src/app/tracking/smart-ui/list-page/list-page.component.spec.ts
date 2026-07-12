import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ItemListActions } from '../../../@shared/data/item-list/item-list.actions';
import {
  selectListItems,
  selectListSearchResult,
  selectListState,
} from '../../../@shared/data/item-list/item-list.selector';
import { DialogsActions } from '../../data/dialogs/dialogs.actions';
import { ListPageComponent } from './list-page.component';

describe('ListPageComponent', () => {
  let store: MockStore;
  let component: ListPageComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListPageComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideMockStore(),
      ],
    });
    store = TestBed.inject(MockStore);
    // Seed the selectors the component reads so its signal fields resolve
    // without a real reducer state.
    store.overrideSelector(selectListState, {
      title: 'Time tracking',
      items: [],
    } as never);
    store.overrideSelector(selectListItems, []);
    store.overrideSelector(selectListSearchResult, undefined);
    component = TestBed.createComponent(ListPageComponent).componentInstance;
  });

  // Recommended MockStore hygiene (NgRx testing guide): drop overrides so they
  // never bleed across tests.
  afterEach(() => store.resetSelectors());

  it('dispatches a search update', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    component.searchFor('milk');
    expect(dispatch).toHaveBeenCalledWith(ItemListActions.updateSearch('milk'));
  });

  it('toggles the sort mode', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    component.setSortMode('name');
    expect(dispatch).toHaveBeenCalledWith(
      ItemListActions.updateSort('name', 'toggle')
    );
  });

  it('dispatches add-from-search and open-create-dialog', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    component.addItemFromSearch();
    component.showCreateDialog();
    expect(dispatch).toHaveBeenCalledWith(ItemListActions.addItemFromSearch());
    expect(dispatch).toHaveBeenCalledWith(
      DialogsActions.showCreateDialogWithSearch()
    );
  });
});
