import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ProductsActions } from './products/products.actions';
import { ShoppingActions } from './shopping/shopping.actions';
import { StorageActions } from './storage/storage.actions';
import { GroceryListActions } from './grocery-list.actions';
import {
  actionsByListId,
  GroceryListEffects,
  groceryListMessageEffects,
} from './grocery-list.effects';
import { IGroceriesState } from '../model/groceries.types';
import { mockKernelState } from '../../@shared/testing/test-data';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import {
  mockGroceriesState,
  mockProduct,
  mockStorageItem,
  mockStorageState,
} from '../testing/groceries.test-data';

describe('GroceryListEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceryListEffects;

  const setup = (grocery: Partial<IGroceriesState> = {}) => {
    const lists = mockGroceriesState(grocery);
    TestBed.configureTestingModule({
      providers: [
        GroceryListEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({ groceries: lists }),
        }),
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
  });

  it('updateFilter / updateSort / updateSearch forward to the list', async () => {
    setup();
    actions$ = of(GroceryListActions.updateFilter('_storage', 'Dairy'));
    expect(await firstValueFrom(effects.updateFilter$)).toEqual(
      StorageActions.updateFilter('Dairy')
    );
    actions$ = of(GroceryListActions.updateSort('_storage', 'name', 'toggle'));
    expect(await firstValueFrom(effects.updateSort$)).toEqual(
      StorageActions.updateSort('name', 'toggle')
    );
    actions$ = of(GroceryListActions.updateSearch('_storage', 'milk'));
    expect(await firstValueFrom(effects.updateSearch$)).toEqual(
      StorageActions.updateSearch('milk')
    );
  });

  it('routes addItemFromSearch to the addressed list', async () => {
    setup();
    actions$ = of(GroceryListActions.addItemFromSearch('_storage'));
    expect(await firstValueFrom(effects.routeAddItemFromSearch$)).toEqual(
      StorageActions.addItemFromSearch()
    );
  });

  it('addItemFromSearch$ builds an item from the list search query', async () => {
    setup({ storage: mockStorageState({ searchQuery: 'Milk' }) });
    actions$ = of(StorageActions.addItemFromSearch());
    const emitted = await firstValueFrom(effects.buildItemFromSearch$);
    expect(emitted.type).toBe('[Storage] addItem');
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
    expect(emitted.type).toBe('[Storage] addOrUpdateItem');
  });

  it('clearSearch$ resets the list search on add item', async () => {
    setup();
    actions$ = of(StorageActions.addItem(mockStorageItem()));
    expect(await firstValueFrom(effects.clearSearch$)).toEqual(
      StorageActions.updateSearch('')
    );
  });
});

// The reaction the three grocery lists were missing entirely: `addItemFromSearch`
// has always dispatched `addItemFailure` per list, but nothing here listened, so
// "already on the list" was silent on groceries while it toasted on tasks and
// tracking.
describe('groceryListMessageEffects', () => {
  let actions$: Observable<Action>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState() }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it.each([
    ['storageAddItemFailure$' as const, StorageActions.addItemFailure],
    ['shoppingAddItemFailure$' as const, ShoppingActions.addItemFailure],
    ['productsAddItemFailure$' as const, ProductsActions.addItemFailure],
  ])('%s toasts a duplicate-name notice', async (key, addItemFailure) => {
    setup();
    actions$ = of(addItemFailure(mockStorageItem({ name: 'Milk' }) as never));

    expect(await firstValueFrom(run(groceryListMessageEffects[key]))).toEqual(
      NotificationsActions.toast({
        key: 'toast.add.item.failure',
        parameters: { name: 'Milk' },
        color: 'medium',
      })
    );
  });
});
