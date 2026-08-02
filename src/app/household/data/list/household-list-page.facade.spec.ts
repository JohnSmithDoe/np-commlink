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
import { HouseholdListPageFacade } from './household-list-page.facade';
import { ProductsActions } from '../products/products.actions';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from '../storage/storage.actions';
import { selectActiveHouseholdListId } from './household-list.selector';

describe('HouseholdListPageFacade cross-list copies', () => {
  let store: MockStore;
  let dispatch: MockInstance<MockStore['dispatch']>;

  const facadeOn = (listId: HouseholdListId): HouseholdListPageFacade => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectActiveHouseholdListId, listId);
    store.refreshState();
    dispatch = vi.spyOn(store, 'dispatch');
    return TestBed.inject(HouseholdListPageFacade);
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

  it('dispatches nothing when the item already lives in the list being viewed', () => {
    facadeOn('_products').addProduct(mockProduct());
    expect(dispatchedActions()).toEqual([]);
  });
});
