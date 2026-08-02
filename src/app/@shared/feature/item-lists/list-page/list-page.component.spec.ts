import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import {
  ListPageFacade,
  LIST_FACADE,
} from '../../../util/item-lists/list-page.facade';
import { ListPageComponent } from './list-page.component';
import { BaseItem } from '../../../model/base-item.types';
import { Category, CategoryId } from '../../../model/category.types';
import { ListState } from '../../../model/item-list.types';

const mockListState = (
  overrides: Partial<ListState<BaseItem>> = {}
): ListState<BaseItem> => ({
  items: [],
  ...overrides,
});

const fakeFacade = (
  state: WritableSignal<ListState<BaseItem> | undefined>
): ListPageFacade & {
  managed: number;
  cleared: number;
  catalog: WritableSignal<Category[]>;
} => {
  const facade = {
    state,
    items: signal(undefined),
    searchResult: signal(undefined),
    catalog: signal<Category[]>([]),
    search: () => {},
    setSortMode: () => {},
    cleared: 0,
    selectCategory: (categoryId?: CategoryId) => {
      if (!categoryId) facade.cleared += 1;
    },
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
  let state: WritableSignal<ListState<BaseItem> | undefined>;
  let facade: ReturnType<typeof fakeFacade>;

  beforeEach(async () => {
    state = signal<ListState<BaseItem> | undefined>(mockListState());
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

  it('resolves the active filter id to the catalog name the caption shows', () => {
    state.set(mockListState({ filterBy: 'cat-1' }));
    facade.catalog.set([{ id: 'cat-1', name: 'Dairy' }]);

    expect(component.filterName()).toBe('Dairy');
  });

  it('clears the filter by selecting no category at all', () => {
    state.set(mockListState({ filterBy: 'cat-1' }));

    component.clearFilter();

    expect(facade.cleared).toBe(1);
  });

  it('delegates the catalog entry point to the domain when it offers one', () => {
    component.manageCategories();

    expect(facade.managed).toBe(1);
  });
});
