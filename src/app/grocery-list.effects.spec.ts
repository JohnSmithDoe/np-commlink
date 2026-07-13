import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ProductsActions } from './groceries/data/products.actions';
import { ShoppingActions } from './groceries/data/shopping.actions';
import { StorageActions } from './groceries/data/storage.actions';
import { GroceryListActions } from './groceries/data/grocery-list/grocery-list.actions';
import { TasksActions } from './tasks/data/tasks.actions';
import { QuickAddActions } from './@shared/data/quick-add/quick-add.actions';
import { updateQuickAddState } from './groceries/data/grocery-list/grocery-list.utils';
import { actionsByListId, GroceryListEffects } from './grocery-list.effects';
import {
  mockAppState,
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from './@shared/testing/test-data';

describe('GroceryListEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceryListEffects;

  const setup = (initialState = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        GroceryListEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
    effects = TestBed.inject(GroceryListEffects);
  };

  describe('actionsByListId', () => {
    it('maps each list id to its action group', () => {
      expect(actionsByListId('_storage')).toBe(StorageActions);
      expect(actionsByListId('_shopping')).toBe(ShoppingActions);
      expect(actionsByListId('_products')).toBe(ProductsActions);
    });
  });

  it('addCategory forwards to the list-specific addCategory', async () => {
    setup();
    actions$ = of(GroceryListActions.addCategory('_storage', 'Dairy'));
    expect(await firstValueFrom(effects.addCategory)).toEqual(
      StorageActions.addCategory('Dairy')
    );
  });

  it('removeCategory forwards to the list-specific removeCategory', async () => {
    setup();
    actions$ = of(GroceryListActions.removeCategory('_shopping', 'Dairy'));
    expect(await firstValueFrom(effects.removeCategory)).toEqual(
      ShoppingActions.removeCategory('Dairy')
    );
  });

  it('updateFilter / updateMode / updateSort / updateSearch forward to the list', async () => {
    setup();
    actions$ = of(GroceryListActions.updateFilter('_storage', 'Dairy'));
    expect(await firstValueFrom(effects.updateFilter)).toEqual(
      StorageActions.updateFilter('Dairy')
    );
    actions$ = of(GroceryListActions.updateMode('_storage', 'categories'));
    expect(await firstValueFrom(effects.updateMode)).toEqual(
      StorageActions.updateMode('categories')
    );
    actions$ = of(GroceryListActions.updateSort('_storage', 'name', 'toggle'));
    expect(await firstValueFrom(effects.updateSort)).toEqual(
      StorageActions.updateSort('name', 'toggle')
    );
    actions$ = of(GroceryListActions.updateSearch('_storage', 'milk'));
    expect(await firstValueFrom(effects.updateSearch$)).toEqual(
      StorageActions.updateSearch('milk')
    );
  });

  describe('addItemFromSearch', () => {
    it('adds an item in alphabetical mode', async () => {
      setup(
        mockAppState({ storage: mockStorageState({ mode: 'alphabetical' }) })
      );
      actions$ = of(GroceryListActions.addItemFromSearch('_storage'));
      expect(await firstValueFrom(effects.addItemFromSearch)).toEqual(
        StorageActions.addItemFromSearch()
      );
    });

    it('adds a category in categories mode', async () => {
      setup(
        mockAppState({ storage: mockStorageState({ mode: 'categories' }) })
      );
      actions$ = of(GroceryListActions.addItemFromSearch('_storage'));
      expect(await firstValueFrom(effects.addItemFromSearch)).toEqual(
        GroceryListActions.addCategoryFromSearch('_storage')
      );
    });
  });

  it('addCategoryFromSearch uses the list search query', async () => {
    setup(
      mockAppState({ storage: mockStorageState({ searchQuery: 'Dairy' }) })
    );
    actions$ = of(GroceryListActions.addCategoryFromSearch('_storage'));
    expect(await firstValueFrom(effects.addCategoryFromSearch)).toEqual(
      StorageActions.addCategory('Dairy')
    );
  });

  describe('addProduct$', () => {
    it('routes a global item to storage or shopping', async () => {
      setup();
      const item = mockProduct();
      actions$ = of(GroceryListActions.addProduct('_storage', item));
      expect(await firstValueFrom(effects.addProduct$)).toEqual(
        StorageActions.addProduct(item)
      );
      actions$ = of(GroceryListActions.addProduct('_shopping', item));
      expect(await firstValueFrom(effects.addProduct$)).toEqual(
        ShoppingActions.addProduct(item)
      );
    });

    it('emits a configuration error for an unsupported list', async () => {
      setup();
      actions$ = of(GroceryListActions.addProduct('_tasks', mockProduct()));
      expect(await firstValueFrom(effects.addProduct$)).toEqual(
        GroceryListActions.configurationError()
      );
    });
  });

  it('addStorageItem$ routes a storage item to globals or shopping', async () => {
    setup();
    const item = mockStorageItem();
    actions$ = of(GroceryListActions.addStorageItem('_products', item));
    expect(await firstValueFrom(effects.addStorageItem$)).toEqual(
      ProductsActions.addStorageItem(item)
    );
    actions$ = of(GroceryListActions.addStorageItem('_shopping', item));
    expect(await firstValueFrom(effects.addStorageItem$)).toEqual(
      ShoppingActions.addStorageItem(item)
    );
  });

  it('addShoppingItem$ routes a shopping item to storage or globals', async () => {
    setup();
    const item = mockShoppingItem();
    actions$ = of(GroceryListActions.addShoppingItem('_storage', item));
    expect(await firstValueFrom(effects.addShoppingItem$)).toEqual(
      StorageActions.addShoppingItem(item)
    );
    actions$ = of(GroceryListActions.addShoppingItem('_products', item));
    expect(await firstValueFrom(effects.addShoppingItem$)).toEqual(
      ProductsActions.addShoppingItem(item)
    );
  });

  // --- item-manipulation orchestration (folded from kitchen-bot's
  // ApplicationEffects) ---

  it('addItemFromSearch$ builds an item from the list search query', async () => {
    setup(mockAppState({ storage: mockStorageState({ searchQuery: 'Milk' }) }));
    actions$ = of(StorageActions.addItemFromSearch());
    const emitted = await firstValueFrom(effects.addItemFromSearch$);
    expect(emitted.type).toBe('[Storage] Add Item');
    expect(
      (emitted as ReturnType<typeof StorageActions.addItem>).item.name
    ).toBe('Milk');
  });

  describe('addOrUpdateItem$', () => {
    it('updates an item that already exists in the list', async () => {
      const item = mockStorageItem();
      setup(mockAppState({ storage: mockStorageState({ items: [item] }) }));
      actions$ = of(StorageActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        StorageActions.updateItem(item)
      );
    });

    it('adds an item when the list is empty', async () => {
      const item = mockStorageItem();
      setup(mockAppState({ storage: mockStorageState({ items: [] }) }));
      actions$ = of(StorageActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        StorageActions.addItem(item)
      );
    });
  });

  it('addItemFromGlobal$ converts a global into a storage add-or-update', async () => {
    setup();
    actions$ = of(StorageActions.addProduct(mockProduct()));
    const emitted = await firstValueFrom(effects.addItemFromGlobal$);
    expect(emitted.type).toBe('[Storage] Add Or Update Item');
  });

  describe('clearFilter$', () => {
    it('clears the filter when leaving categories mode', async () => {
      setup();
      actions$ = of(StorageActions.updateMode('alphabetical'));
      expect(await firstValueFrom(effects.clearFilter$)).toEqual(
        StorageActions.updateFilter()
      );
    });

    it('does not emit for categories mode', () => {
      setup();
      actions$ = of(StorageActions.updateMode('categories'));
      const emissions: Action[] = [];
      effects.clearFilter$.subscribe((action) => emissions.push(action));
      expect(emissions).toEqual([]);
    });
  });

  it('clearSearch$ resets the list search on add item', async () => {
    setup();
    actions$ = of(StorageActions.addItem(mockStorageItem()));
    expect(await firstValueFrom(effects.clearSearch$)).toEqual(
      StorageActions.updateSearch('')
    );
  });

  it('updateQuickAdd$ recomputes the quick-add state on search', async () => {
    const state = mockAppState({
      storage: mockStorageState({ searchQuery: 'milk' }),
    });
    setup(state);
    actions$ = of(StorageActions.updateSearch('milk'));
    expect(await firstValueFrom(effects.updateQuickAdd$)).toEqual(
      QuickAddActions.updateState(updateQuickAddState(state, '_storage'))
    );
  });

  it('exposes the tasks action group via actionsByListId', () => {
    expect(actionsByListId('_tasks')).toBe(TasksActions);
  });
});
