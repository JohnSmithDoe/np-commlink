import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HouseholdListId } from '../../model/household-list.types';
import {
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
} from '../../testing/household.test-data';
import { HouseholdCopyService } from './household-copy.service';
import { ProductsActions } from '../products/products.actions';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from '../storage/storage.actions';
import { selectActiveHouseholdListId } from './household-list.selector';

describe('HouseholdCopyService', () => {
  let store: MockStore;
  let dispatch: MockInstance<MockStore['dispatch']>;

  const copyOn = (listId: HouseholdListId): HouseholdCopyService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectActiveHouseholdListId, listId);
    store.refreshState();
    dispatch = vi.spyOn(store, 'dispatch');
    return TestBed.inject(HouseholdCopyService);
  };

  const dispatchedActions = (): unknown[] =>
    dispatch.mock.calls.map(([action]) => action);

  afterEach(() => store.resetSelectors());

  it('copies a product into the list being viewed', () => {
    const item = mockProduct();

    copyOn('_storage').addProduct(item);
    expect(dispatchedActions()).toEqual([StorageActions.addProduct(item)]);

    copyOn('_shopping').addProduct(item);
    expect(dispatchedActions()).toEqual([ShoppingActions.addProduct(item)]);
  });

  it('copies a storage item into the list being viewed', () => {
    const item = mockStorageItem();

    copyOn('_products').addStorageItem(item);
    expect(dispatchedActions()).toEqual([ProductsActions.addStorageItem(item)]);

    copyOn('_shopping').addStorageItem(item);
    expect(dispatchedActions()).toEqual([ShoppingActions.addStorageItem(item)]);
  });

  it('copies a shopping item into the list being viewed', () => {
    const item = mockShoppingItem();

    copyOn('_storage').addShoppingItem(item);
    expect(dispatchedActions()).toEqual([StorageActions.addShoppingItem(item)]);

    copyOn('_products').addShoppingItem(item);
    expect(dispatchedActions()).toEqual([
      ProductsActions.addShoppingItem(item),
    ]);
  });

  it('dispatches nothing when the item already lives in the list being viewed', () => {
    copyOn('_products').addProduct(mockProduct());
    expect(dispatchedActions()).toEqual([]);
  });

  it('copies to a named target list rather than the one being viewed', () => {
    const item = mockProduct();

    copyOn('_products').addProductToList('_shopping', item);

    expect(dispatchedActions()).toEqual([ShoppingActions.addProduct(item)]);
  });
});
