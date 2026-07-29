import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { IListPageFacade, LIST_FACADE } from '../../util/list/list-page.facade';
import { ListPageComponent } from './list-page.component';
import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';

const mockListState = (
  overrides: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
  items: [],
  categories: [],
  mode: 'alphabetical',
  ...overrides,
});

// Domain-blind stub of the facade contract: the generic page must be testable
// without reaching into any concrete list domain (grocery/tasks).
const fakeFacade = (
  state: WritableSignal<IListState<IBaseItem> | undefined>
): IListPageFacade & {
  opened: number;
  savedCategories: string[];
  itemsFromSearch: number;
  categoriesFromSearch: number;
} => {
  const facade = {
    state,
    items: signal(undefined),
    searchResult: signal(undefined),
    categories: signal([]),
    search: () => {},
    setDisplayMode: () => {},
    setSortMode: () => {},
    selectCategory: () => {},
    deleteCategory: () => {},
    opened: 0,
    savedCategories: [] as string[],
    itemsFromSearch: 0,
    categoriesFromSearch: 0,
    addItemFromSearch: () => {
      facade.itemsFromSearch += 1;
    },
    addCategoryFromSearch: () => {
      facade.categoriesFromSearch += 1;
    },
    showCreateDialog: () => {
      facade.opened += 1;
    },
    saveCategory: (name: string) => {
      facade.savedCategories.push(name);
    },
  };
  return facade;
};

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<ListPageComponent>;
  let component: ListPageComponent;
  let state: WritableSignal<IListState<IBaseItem> | undefined>;
  let facade: ReturnType<typeof fakeFacade>;

  beforeEach(async () => {
    state = signal<IListState<IBaseItem> | undefined>(mockListState());
    facade = fakeFacade(state);
    await TestBed.configureTestingModule({
      imports: [ListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: LIST_FACADE, useValue: facade },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates the add affordance to the domain in item mode', () => {
    component.showCreateDialog();

    expect(facade.opened).toBe(1);
    expect(component.categoryDialog()).toBeNull();
  });

  // In categories display mode the same button names a new CATEGORY. This branch
  // used to be duplicated across two guarded per-domain effects.
  it('opens its own category dialog in categories mode, seeded with the search term', () => {
    state.set(mockListState({ mode: 'categories', searchQuery: 'Dairy' }));

    component.showCreateDialog();

    expect(component.categoryDialog()).toBe('Dairy');
    expect(facade.opened).toBe(0);
  });

  it('persists a confirmed category through the facade and closes', () => {
    state.set(mockListState({ mode: 'categories', searchQuery: 'Dairy' }));
    component.showCreateDialog();

    component.saveCategory('Fridge');

    expect(facade.savedCategories).toEqual(['Fridge']);
    expect(component.categoryDialog()).toBeNull();
  });

  it('adds an item from the searchbar in item mode', () => {
    component.addItemFromSearch();

    expect(facade.itemsFromSearch).toBe(1);
    expect(facade.categoriesFromSearch).toBe(0);
  });

  // Same rule as the header button, same single owner: the searchbar's enter key
  // names a category while the list is showing categories. It used to be decided
  // a third time, in each domain's facade.
  it('adds a category from the searchbar in categories mode', () => {
    state.set(mockListState({ mode: 'categories', searchQuery: 'Dairy' }));

    component.addItemFromSearch();

    expect(facade.categoriesFromSearch).toBe(1);
    expect(facade.itemsFromSearch).toBe(0);
  });

  it('derives the filter state the header reads from the list state alone', () => {
    expect(component.filterState()).toEqual({
      isCategoryModeOrHasFilter: false,
      hasFilter: false,
    });

    state.set(mockListState({ filterBy: 'cat-1' }));

    expect(component.filterState()).toEqual({
      isCategoryModeOrHasFilter: true,
      hasFilter: true,
    });
  });
});
