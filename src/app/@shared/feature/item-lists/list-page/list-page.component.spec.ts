import { signal, TemplateRef, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-providers';
import {
  ListPageFacade,
  ListSection,
  LIST_FACADE,
} from '../../../util/item-lists/list-page.facade';
import { CategoryFilterFacade } from '../../../data/item-lists/category-filter.facade';
import { ListPageComponent } from './list-page.component';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';
import { ItemList, SearchResult } from '../../../model/item-list.types';
import { ITEM_FILTERS } from '../../../util/item-lists/list-filter';

const mockListState = (
  overrides: Partial<ItemList<BaseItem>> = {}
): ItemList<BaseItem> => ({
  items: [],
  ...overrides,
});

const manyItems = (count: number): BaseItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `t-${index}`,
    name: `Entry ${index}`,
  }));

const scrolledToEnd = () =>
  ({
    target: { complete: () => Promise.resolve() },
  }) as InfiniteScrollCustomEvent;

const fakeFacade = (
  state: WritableSignal<ItemList<BaseItem> | undefined>
): Omit<ListPageFacade, 'windowSize'> & {
  managed: number;
  reordered: { ids: string[]; sectionId?: string }[];
  catalog: WritableSignal<Category[]>;
  items: WritableSignal<BaseItem[] | undefined>;
  searchResult: WritableSignal<SearchResult<BaseItem> | undefined>;
  sections?: WritableSignal<ListSection[]>;
  windowSize: WritableSignal<number | undefined>;
} => {
  const facade = {
    state,
    items: signal<BaseItem[] | undefined>(undefined),
    searchResult: signal<SearchResult<BaseItem> | undefined>(undefined),
    catalog: signal<Category[]>([]),
    windowSize: signal<number | undefined>(undefined),
    search: () => {},
    setSortMode: () => {},
    selectCategory: () => {},
    addItemFromSearch: () => {},
    showCreateDialog: () => {},
    managed: 0,
    manageCategories: () => {
      facade.managed += 1;
    },
    reordered: [] as { ids: string[]; sectionId?: string }[],
    reorder: (ids: string[], sectionId?: string) => {
      facade.reordered.push({ ids, sectionId });
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

  it('renders every item while no window is asked for', () => {
    facade.items.set(manyItems(500));

    expect(component.windowedItems()).toHaveLength(500);
    expect(component.hiddenCount()).toBe(0);
  });

  it('renders only the window once one is asked for', () => {
    facade.windowSize.set(200);
    facade.items.set(manyItems(500));

    expect(component.windowedItems()).toHaveLength(200);
    expect(component.hiddenCount()).toBe(300);
  });

  it('leaves a list shorter than the window whole', () => {
    facade.windowSize.set(200);
    facade.items.set(manyItems(12));

    expect(component.windowedItems()).toHaveLength(12);
    expect(component.hiddenCount()).toBe(0);
  });

  it('widens the window by one step at a time', async () => {
    facade.windowSize.set(200);
    facade.items.set(manyItems(500));

    await component.showMore(scrolledToEnd());

    expect(component.windowedItems()).toHaveLength(400);
    expect(component.hiddenCount()).toBe(100);
  });

  it('collapses a widened window when the search changes', async () => {
    facade.windowSize.set(200);
    facade.items.set(manyItems(500));
    await component.showMore(scrolledToEnd());

    state.set(mockListState({ searchQuery: 'milk' }));

    expect(component.windowedItems()).toHaveLength(200);
  });

  it('keeps the list unknown rather than empty while no items have arrived', () => {
    facade.windowSize.set(200);
    facade.items.set(undefined);

    expect(component.windowedItems()).toBeUndefined();
    expect(component.hiddenCount()).toBe(0);
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

  it('renders the window as one unnamed section while the facade names none', () => {
    facade.windowSize.set(2);
    facade.items.set(manyItems(5));

    expect(component.sections()).toEqual([
      { id: '', items: component.windowedItems() },
    ]);
    expect(component.showSectionHeaders()).toBe(false);
  });

  it('heads the facade sections only once there is more than one', () => {
    facade.sections = signal<ListSection[]>([
      { id: 'pinned', labelKey: 'a.pinned', items: [] },
    ]);
    expect(component.showSectionHeaders()).toBe(false);

    facade.sections.update((sections) => [
      ...sections,
      { id: 'others', labelKey: 'a.others', items: [] },
    ]);

    expect(component.showSectionHeaders()).toBe(true);
  });

  it('arms the drag handle while the whole list is on screen', () => {
    expect(component.reorderArmed()).toBe(true);
  });

  it('withdraws the drag handle from every partial view', () => {
    facade.searchResult.set({ searchTerm: 'mi', listItems: [] });
    expect(component.reorderArmed()).toBe(false);

    facade.searchResult.set(undefined);
    state.set(mockListState({ filterBy: 'c-1' }));
    expect(component.reorderArmed()).toBe(false);

    state.set(mockListState());
    facade.windowSize.set(2);
    facade.items.set(manyItems(5));
    expect(component.reorderArmed()).toBe(false);
  });

  it('reports a reorder under the section it happened in', () => {
    component.facade.reorder?.(['b', 'a'], 'pinned');

    expect(facade.reordered).toEqual([
      { ids: ['b', 'a'], sectionId: 'pinned' },
    ]);
  });
});

describe('ListPageComponent without a reorder command', () => {
  it('never arms the drag handle', async () => {
    const facade = fakeFacade(signal(mockListState()));
    delete (facade as Partial<ListPageFacade>).reorder;

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

    expect(fixture.componentInstance.canReorder).toBe(false);
    expect(fixture.componentInstance.reorderArmed()).toBe(false);
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
