import { signal, TemplateRef, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import {
  ListPageFacade,
  LIST_FACADE,
} from '../../../util/item-lists/list-page.facade';
import { CategoryFilterFacade } from '../../../data/item-lists/category-filter.facade';
import { ListPageComponent } from './list-page.component';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';
import { ItemList } from '../../../model/item-list.types';
import { ITEM_FILTERS } from '../../../util/item-lists/list-filter';

const mockListState = (
  overrides: Partial<ItemList<BaseItem>> = {}
): ItemList<BaseItem> => ({
  items: [],
  ...overrides,
});

const fakeFacade = (
  state: WritableSignal<ItemList<BaseItem> | undefined>
): ListPageFacade & {
  managed: number;
  catalog: WritableSignal<Category[]>;
  items: WritableSignal<BaseItem[] | undefined>;
} => {
  const facade = {
    state,
    items: signal<BaseItem[] | undefined>(undefined),
    searchResult: signal(undefined),
    catalog: signal<Category[]>([]),
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
  let state: WritableSignal<ItemList<BaseItem> | undefined>;
  let facade: ReturnType<typeof fakeFacade>;
  let cleared: number;

  beforeEach(async () => {
    state = signal<ItemList<BaseItem> | undefined>(mockListState());
    facade = fakeFacade(state);
    cleared = 0;
    await TestBed.configureTestingModule({
      imports: [ListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: LIST_FACADE, useValue: facade },
        {
          provide: CategoryFilterFacade,
          useValue: { clear: () => (cleared += 1) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears the filter through one action instead of touching the router', () => {
    state.set(mockListState({ filterBy: 'cat-1' }));

    component.clearFilter();

    expect(cleared).toBe(1);
  });

  it('delegates the catalog entry point to the domain when it offers one', () => {
    component.manageCategories();

    expect(facade.managed).toBe(1);
  });

  it('withholds the empty state while the list is still unknown', () => {
    facade.items.set(undefined);

    expect(component.isKnownEmpty()).toBe(false);
  });

  it('shows the empty state once the list is known to hold nothing', () => {
    facade.items.set([]);

    expect(component.isKnownEmpty()).toBe(true);
  });

  it('shows no empty state for a populated list', () => {
    facade.items.set([{ id: 'a', name: 'Milk' }]);

    expect(component.isKnownEmpty()).toBe(false);
  });

  it('offers no uncategorized filter when every item carries a category', () => {
    state.set(
      mockListState({
        items: [{ id: 'a', name: 'Milk', categoryIds: ['c-1'] }],
      })
    );

    expect(component.extraFilters()).toEqual([]);
  });

  it('renders no chip bar while the catalog is empty', async () => {
    facade.catalog.set([]);

    fixture.componentRef.setInput('itemTemplate', {} as TemplateRef<unknown>);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('app-category-filter-bar')
    ).toBeNull();
  });

  it('keeps a filter offered once armed, reading the unfiltered items', () => {
    state.set(
      mockListState({
        items: [
          { id: 'a', name: 'Milk', categoryIds: ['c-1'] },
          { id: 'b', name: 'Salt' },
        ],
        filterBy: 'c-1',
      })
    );
    facade.items.set([{ id: 'a', name: 'Milk', categoryIds: ['c-1'] }]);

    expect(component.extraFilters()).toEqual(ITEM_FILTERS);
  });
});

describe('ListPageComponent without a catalog editor', () => {
  it('still renders the chip bar, because the chips answer to the catalog', async () => {
    const facade = fakeFacade(signal(mockListState()));
    facade.catalog.set([{ id: 'c-1', name: 'Dairy' }]);
    delete (facade as Partial<ListPageFacade>).manageCategories;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ListPageComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: LIST_FACADE, useValue: facade },
        { provide: CategoryFilterFacade, useValue: { clear: () => {} } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ListPageComponent);
    fixture.componentRef.setInput('itemTemplate', {} as TemplateRef<unknown>);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.canManageCategories).toBe(false);
    expect(
      fixture.nativeElement.querySelector('app-category-filter-bar')
    ).not.toBeNull();
  });
});
