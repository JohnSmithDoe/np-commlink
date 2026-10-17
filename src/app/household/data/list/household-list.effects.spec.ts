/* ─── why ─────────────────────────────────────────────────────────
 * Two describes, because the file now holds two different things. The
 * class is the multi-list router and is asserted directly. The three
 * `createItemListEffects` invocations are not — the builder is spec'd
 * once beside itself; what is asserted here is only that each slice's
 * flow reaches its OWN slice, which the hand-rolled version derived from
 * an action-type prefix and a `switch` and this one derives from three
 * separate registrations.
 * ───────────────────────────────────────────────────────────────── */

import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ProductsActions } from '../products/products.actions';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from '../storage/storage.actions';
import { HouseholdListActions } from './household-list.actions';
import {
  actionsByListId,
  HouseholdListEffects,
  productsListEffects,
  shoppingListEffects,
  storageListEffects,
} from './household-list.effects';
import { HouseholdState } from '../../model/household.types';
import { mockKernelState } from '../../../@shared/testing/test-data';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';

describe('HouseholdListEffects', () => {
  let actions$: Observable<Action>;
  let effects: HouseholdListEffects;

  const setup = () => {
    const lists = mockHouseholdState();
    TestBed.configureTestingModule({
      providers: [
        HouseholdListEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({ household: lists }),
        }),
      ],
    });
    effects = TestBed.inject(HouseholdListEffects);
    return lists;
  };

  describe('actionsByListId', () => {
    it('maps each list id to its action group', () => {
      expect(actionsByListId('_storage')).toBe(StorageActions);
      expect(actionsByListId('_shopping')).toBe(ShoppingActions);
      expect(actionsByListId('_products')).toBe(ProductsActions);
    });
  });

  it('updateFilter / updateSort / updateSearch forward to the list', async () => {
    setup();
    actions$ = of(HouseholdListActions.updateFilter('_storage', 'Dairy'));
    expect(await firstValueFrom(effects.updateFilter$)).toEqual(
      StorageActions.updateFilter('Dairy')
    );
    actions$ = of(
      HouseholdListActions.updateSort('_storage', 'name', 'toggle')
    );
    expect(await firstValueFrom(effects.updateSort$)).toEqual(
      StorageActions.updateSort('name', 'toggle')
    );
    actions$ = of(HouseholdListActions.updateSearch('_storage', 'milk'));
    expect(await firstValueFrom(effects.updateSearch$)).toEqual(
      StorageActions.updateSearch('milk')
    );
  });

  it('routes addItemFromSearch to the addressed list', async () => {
    setup();
    actions$ = of(HouseholdListActions.addItemFromSearch('_storage'));
    expect(await firstValueFrom(effects.routeAddItemFromSearch$)).toEqual(
      StorageActions.addItemFromSearch()
    );
  });

  const typeOf = async (effect: Observable<Action>) => {
    const action = await firstValueFrom(effect);
    return action.type;
  };

  it('copies a product into storage and into shopping', async () => {
    setup();
    actions$ = of(StorageActions.addProduct(mockProduct()));
    expect(await typeOf(effects.storageFromProduct$)).toBe(
      '[Storage] addOrUpdateItem'
    );

    actions$ = of(ShoppingActions.addProduct(mockProduct()));
    expect(await typeOf(effects.shoppingFromProduct$)).toBe(
      '[Shopping] addOrUpdateItem'
    );
  });

  it('copies a shopping item into storage and into the catalog', async () => {
    setup();
    actions$ = of(StorageActions.addShoppingItem(mockShoppingItem()));
    expect(await typeOf(effects.storageFromShopping$)).toBe(
      '[Storage] addOrUpdateItem'
    );

    actions$ = of(ProductsActions.addShoppingItem(mockShoppingItem()));
    expect(await typeOf(effects.productFromShopping$)).toBe(
      '[Products] addOrUpdateItem'
    );
  });

  it('copies a storage item into shopping and into the catalog', async () => {
    setup();
    actions$ = of(ShoppingActions.addStorageItem(mockStorageItem()));
    expect(await typeOf(effects.shoppingFromStorage$)).toBe(
      '[Shopping] addOrUpdateItem'
    );

    actions$ = of(ProductsActions.addStorageItem(mockStorageItem()));
    expect(await typeOf(effects.productFromStorage$)).toBe(
      '[Products] addOrUpdateItem'
    );
  });
});
describe('the per-slice list flow', () => {
  let actions$: Observable<Action>;

  const setup = (household: Partial<HouseholdState> = {}) => {
    const initialState = mockKernelState({
      household: mockHouseholdState(household),
    });
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it('shopping builds its own item from its own search query', async () => {
    setup({ shopping: mockShoppingState({ searchQuery: 'Milk' }) });
    actions$ = of(ShoppingActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(shoppingListEffects.addItemFromSearch$)
    );
    expect(emitted.type).toBe('[Shopping] addItem');
    expect(emitted.item.name).toBe('Milk');
  });

  it('storage builds its own item from its own search query', async () => {
    setup({ storage: mockStorageState({ searchQuery: 'Milk' }) });
    actions$ = of(StorageActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(storageListEffects.addItemFromSearch$)
    );
    expect(emitted.type).toBe('[Storage] addItem');
    expect(emitted.item.name).toBe('Milk');
  });

  it('products builds its own item from its own search query', async () => {
    setup({ products: mockProductsState({ searchQuery: 'Milk' }) });
    actions$ = of(ProductsActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(productsListEffects.addItemFromSearch$)
    );
    expect(emitted.type).toBe('[Products] addItem');
    expect(emitted.item.name).toBe('Milk');
  });
});
