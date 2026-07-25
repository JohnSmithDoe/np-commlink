import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { IBaseItem, IListState } from '../../model/types';
import { IListPageFacade, LIST_FACADE } from '../../util/list/list-page.facade';
import { ListPageComponent } from './list-page.component';

const mockListState = (
  overrides: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
  title: 'List',
  items: [],
  categories: [],
  mode: 'alphabetical',
  ...overrides,
});

// Domain-blind stub of the facade contract: the generic page must be testable
// without reaching into any concrete list domain (grocery/tasks).
const fakeFacade = (
  state: WritableSignal<IListState<IBaseItem> | undefined>
): IListPageFacade & { opened: number; savedCategories: string[] } => {
  const facade = {
    state,
    filter: signal({ isCategoryModeOrHasFilter: false, hasFilter: false }),
    items: signal(undefined),
    searchResult: signal(undefined),
    categories: signal([]),
    search: () => {},
    addItemFromSearch: () => {},
    addCategoryFromSearch: () => {},
    setDisplayMode: () => {},
    setSortMode: () => {},
    selectCategory: () => {},
    deleteCategory: () => {},
    opened: 0,
    savedCategories: [] as string[],
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
});
