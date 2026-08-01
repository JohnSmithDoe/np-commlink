import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TGroceryListId } from '../model/grocery-list.types';
import {
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
} from '../testing/groceries.test-data';
import { GroceryListPageFacade } from './grocery-list-page.facade';
import { ProductsActions } from './products/products.actions';
import { ShoppingActions } from './shopping/shopping.actions';
import { StorageActions } from './storage/storage.actions';
import { selectListIdParameter } from './grocery-list.selector';

// The cross-list copies used to be three routing effects that switched on the
// listId and fell through a `default:` onto a `configurationError` action nothing
// handled. The facade knows the active list synchronously, so these assert the
// concrete action it dispatches — and that the invalid diagonal dispatches
// nothing at all rather than an action no reducer reads.
describe('GroceryListPageFacade cross-list copies', () => {
  let store: MockStore;
  let dispatch: MockInstance<MockStore['dispatch']>;

  // A fresh injector per case: the facade is a root singleton, so reusing one
  // across two list ids would keep the first `selectListIdParameter` override.
  const facadeOn = (listId: TGroceryListId): GroceryListPageFacade => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectListIdParameter, listId);
    store.refreshState();
    dispatch = vi.spyOn(store, 'dispatch');
    return TestBed.inject(GroceryListPageFacade);
  };

  const dispatchedActions = (): unknown[] =>
    dispatch.mock.calls.map(([action]) => action);

  afterEach(() => store.resetSelectors());

  it('copies a product into the list being viewed', () => {
    const item = mockProduct();

    facadeOn('_storage').addProduct(item);
    expect(dispatchedActions()).toEqual([StorageActions.addProduct(item)]);

    facadeOn('_shopping').addProduct(item);
    expect(dispatchedActions()).toEqual([ShoppingActions.addProduct(item)]);
  });

  it('copies a storage item into the list being viewed', () => {
    const item = mockStorageItem();

    facadeOn('_products').addStorageItem(item);
    expect(dispatchedActions()).toEqual([ProductsActions.addStorageItem(item)]);

    facadeOn('_shopping').addStorageItem(item);
    expect(dispatchedActions()).toEqual([ShoppingActions.addStorageItem(item)]);
  });

  it('copies a shopping item into the list being viewed', () => {
    const item = mockShoppingItem();

    facadeOn('_storage').addShoppingItem(item);
    expect(dispatchedActions()).toEqual([StorageActions.addShoppingItem(item)]);

    facadeOn('_products').addShoppingItem(item);
    expect(dispatchedActions()).toEqual([
      ProductsActions.addShoppingItem(item),
    ]);
  });

  // A list never shows its own suggestion bucket, so this is unreachable from the
  // UI — but it now dispatches nothing instead of an action no one handles.
  it('dispatches nothing when the item already lives in the list being viewed', () => {
    facadeOn('_products').addProduct(mockProduct());
    expect(dispatchedActions()).toEqual([]);
  });
});
