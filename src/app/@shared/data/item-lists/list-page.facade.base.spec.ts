import { signal } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { ItemListSortType } from '../../model/item-list.types';
import { BaseListPageFacade, itemListCommands } from './list-page.facade.base';

const calls: string[] = [];

const searchOnlyPort = () => {
  return {
    search: (term?: string) => {
      calls.push(`search:${term}`);
    },
    setSortMode: (type: ItemListSortType, direction?: string) => {
      calls.push(`sort:${type}:${direction}`);
    },
  };
};

class SearchOnlyFacade extends BaseListPageFacade {
  readonly state = signal(undefined);
  readonly items = signal(undefined);
  readonly searchResult = signal(undefined);

  protected readonly commands = searchOnlyPort();

  showCreateDialog(): void {
    calls.push('createDialog');
  }
}

class AddsFromSearchFacade extends SearchOnlyFacade {
  protected override readonly commands = {
    ...searchOnlyPort(),
    addItemFromSearch: () => {
      calls.push('addFromSearch');
    },
  };
}

describe('BaseListPageFacade', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('opens the create dialog when the port has no add-from-search action', () => {
    const facade = new SearchOnlyFacade();
    facade.addItemFromSearch();

    expect(calls).toEqual(['createDialog']);
  });

  it('uses the port instead of the dialog when it has one', () => {
    const facade = new AddsFromSearchFacade();
    facade.addItemFromSearch();

    expect(calls).toEqual(['addFromSearch']);
  });

  it('is inert on selectCategory when the list has no category axis', () => {
    const facade = new SearchOnlyFacade();
    facade.selectCategory('cat-1');

    expect(calls).toEqual([]);
  });

  it('always asks the port to toggle the sort direction', () => {
    const facade = new SearchOnlyFacade();
    facade.setSortMode('name');

    expect(calls).toEqual(['sort:name:toggle']);
  });
});

const updateSearch = (searchQuery?: string) =>
  ({ type: '[Test] search', searchQuery }) as Action;
const updateSort = (sortBy?: ItemListSortType) =>
  ({ type: '[Test] sort', sortBy }) as Action;
const updateFilter = (filterBy?: string) =>
  ({ type: '[Test] filter', filterBy }) as Action;

const storeStub = () => {
  const dispatch = vi.fn();
  return { store: { dispatch } as unknown as Store, dispatch };
};

describe('itemListCommands', () => {
  it('offers no category axis when the action group has no updateFilter', () => {
    const { store } = storeStub();

    const commands = itemListCommands(store, { updateSearch, updateSort });

    expect(commands.selectCategory).toBeUndefined();
    expect(commands.addItemFromSearch).toBeUndefined();
  });

  it('routes selectCategory to updateFilter when the group has one', () => {
    const { store, dispatch } = storeStub();

    itemListCommands(store, {
      updateSearch,
      updateSort,
      updateFilter,
    }).selectCategory?.('cat-1');

    expect(dispatch).toHaveBeenCalledWith(updateFilter('cat-1'));
  });
});
