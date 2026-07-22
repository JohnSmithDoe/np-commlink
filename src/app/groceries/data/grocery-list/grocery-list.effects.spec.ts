import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ProductsActions } from '../products.actions';
import { ShoppingActions } from '../shopping.actions';
import { StorageActions } from '../storage.actions';
import { GroceryListActions } from './grocery-list.actions';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import { QuickAddActions } from '../quick-add/quick-add.actions';
import { updateQuickAddState } from './grocery-list.utils';
import { actionsByListId, GroceryListEffects } from './grocery-list.effects';
import { IGroceryLists } from '../../model';
import { mockAppState } from '../../../@shared/testing/test-data';
import {
  mockGroceryLists,
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from '../../testing/grocery.test-data';

describe('GroceryListEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceryListEffects;

  const setup = (grocery: Partial<IGroceryLists> = {}) => {
    const lists = mockGroceryLists(grocery);
    TestBed.configureTestingModule({
      providers: [
        GroceryListEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockAppState(lists) }),
      ],
    });
    effects = TestBed.inject(GroceryListEffects);
    return lists;
  };

  describe('actionsByListId', () => {
    it('maps each grocery list id to its action group', () => {
      expect(actionsByListId('_storage')).toBe(StorageActions);
      expect(actionsByListId('_shopping')).toBe(ShoppingActions);
      expect(actionsByListId('_products')).toBe(ProductsActions);
    });

    it('throws on a non-grocery list id (tasks is a sealed sibling)', () => {
      expect(() => actionsByListId('_tasks')).toThrow();
    });
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
      setup({ storage: mockStorageState({ mode: 'alphabetical' }) });
      actions$ = of(GroceryListActions.addItemFromSearch('_storage'));
      expect(await firstValueFrom(effects.addItemFromSearch)).toEqual(
        StorageActions.addItemFromSearch()
      );
    });

    it('adds a category in categories mode', async () => {
      setup({ storage: mockStorageState({ mode: 'categories' }) });
      actions$ = of(GroceryListActions.addItemFromSearch('_storage'));
      expect(await firstValueFrom(effects.addItemFromSearch)).toEqual(
        GroceryListActions.addCategoryFromSearch('_storage')
      );
    });
  });

  it('addCategoryFromSearch mints a shared-catalog category from the list search query', async () => {
    setup({ storage: mockStorageState({ searchQuery: 'Dairy' }) });
    actions$ = of(GroceryListActions.addCategoryFromSearch('_storage'));
    // The minted id is a uuid — assert on the type + resolved name only.
    const emitted = (await firstValueFrom(
      effects.addCategoryFromSearch
    )) as ReturnType<typeof GroceryCategoriesActions.add>;
    expect(emitted.type).toBe(GroceryCategoriesActions.add.type);
    expect(emitted.category.name).toBe('Dairy');
  });

  it('addCategoryFromSearch also clears the originating list search', async () => {
    setup({ storage: mockStorageState({ searchQuery: 'Dairy' }) });
    actions$ = of(GroceryListActions.addCategoryFromSearch('_storage'));
    expect(await firstValueFrom(effects.clearSearchAfterAddCategory$)).toEqual(
      StorageActions.updateSearch('')
    );
  });

  describe('addProduct$', () => {
    it('routes a product to storage or shopping', async () => {
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

  it('addStorageItem$ routes a storage item to products or shopping', async () => {
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

  it('addShoppingItem$ routes a shopping item to storage or products', async () => {
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

  it('addItemFromSearch$ builds an item from the list search query', async () => {
    setup({ storage: mockStorageState({ searchQuery: 'Milk' }) });
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
      setup({ storage: mockStorageState({ items: [item] }) });
      actions$ = of(StorageActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        StorageActions.updateItem(item)
      );
    });

    it('adds an item when the list is empty', async () => {
      const item = mockStorageItem();
      setup({ storage: mockStorageState({ items: [] }) });
      actions$ = of(StorageActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        StorageActions.addItem(item)
      );
    });
  });

  it('addItemFromProduct$ converts a product into a storage add-or-update', async () => {
    setup();
    actions$ = of(StorageActions.addProduct(mockProduct()));
    const emitted = await firstValueFrom(effects.addItemFromProduct$);
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
    const lists = setup({
      storage: mockStorageState({ searchQuery: 'milk' }),
    });
    actions$ = of(StorageActions.updateSearch('milk'));
    expect(await firstValueFrom(effects.updateQuickAdd$)).toEqual(
      QuickAddActions.updateState(updateQuickAddState(lists, '_storage'))
    );
  });
});
