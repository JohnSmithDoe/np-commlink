import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import {
  IListPageFacade,
  LIST_FACADE,
} from '../../../util/item-lists/list-page.facade';
import { ListPageComponent } from './list-page.component';
import { IBaseItem } from '../../../model/base-item.types';
import { ICategory } from '../../../model/category.types';
import { IListState } from '../../../model/item-list.types';

const mockListState = (
  overrides: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
  items: [],
  ...overrides,
});

// Domain-blind stub of the facade contract: the generic page must be testable
// without reaching into any concrete list domain (grocery/tasks).
const fakeFacade = (
  state: WritableSignal<IListState<IBaseItem> | undefined>
): IListPageFacade & {
  managed: number;
  catalog: WritableSignal<ICategory[]>;
} => {
  const facade = {
    state,
    items: signal(undefined),
    searchResult: signal(undefined),
    catalog: signal<ICategory[]>([]),
    search: () => {},
    setSortMode: () => {},
    selectCategory: () => {},
    addItemFromSearch: () => {},
    showCreateDialog: () => {},
    managed: 0,
    manageCategories: () => {
      facade.managed += 1;
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

  it('derives the filter state the header reads from the list state alone', () => {
    expect(component.hasFilter()).toBe(false);

    state.set(mockListState({ filterBy: 'cat-1' }));

    expect(component.hasFilter()).toBe(true);
  });

  // The catalog comes off the facade now, not out of the list state — a list no
  // longer carries its own copy of it.
  it('resolves the active filter id to the catalog name the caption shows', () => {
    state.set(mockListState({ filterBy: 'cat-1' }));
    facade.catalog.set([{ id: 'cat-1', name: 'Dairy' }]);

    expect(component.filterName()).toBe('Dairy');
  });

  // `manageCategories` is optional on the contract — category-less lists
  // (tracking) omit it — and template syntax cannot express an optional call.
  it('delegates the catalog entry point to the domain when it offers one', () => {
    component.manageCategories();

    expect(facade.managed).toBe(1);
  });
});
