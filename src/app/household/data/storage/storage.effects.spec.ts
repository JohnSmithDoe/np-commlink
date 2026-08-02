import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
} from '../../testing/household.test-data';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from './storage.actions';
import { StorageEffects } from './storage.effects';

describe('StorageEffects', () => {
  let actions$: Observable<Action>;
  let effects: StorageEffects;

  const setup = (initialState = mockKernelState()) => {
    TestBed.configureTestingModule({
      providers: [
        StorageEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
    effects = TestBed.inject(StorageEffects);
  };

  it('copyFromShoppingList$ removes the copied items from the shopping list', async () => {
    setup();
    const items = [mockShoppingItem()];
    actions$ = of(StorageActions.addShoppingList(items));
    expect(await firstValueFrom(effects.copyFromShoppingList$)).toEqual(
      ShoppingActions.removeItems(items)
    );
  });

  describe('copyToShoppingList$', () => {
    it('increases the quantity when a matching shopping item already exists', async () => {
      const existing = mockShoppingItem({ name: 'Milk' });
      setup(
        mockKernelState({
          household: mockHouseholdState({
            shopping: mockShoppingState({ items: [existing] }),
          }),
        })
      );
      actions$ = of(
        StorageActions.copyToShoppinglist(mockStorageItem({ name: 'Milk' }))
      );
      expect(await firstValueFrom(effects.copyToShoppingList$)).toEqual(
        ShoppingActions.updateItem({
          ...existing,
          quantity: existing.quantity + 1,
        })
      );
    });

    it('adds a new shopping item when none matches', async () => {
      setup(
        mockKernelState({
          household: mockHouseholdState({
            shopping: mockShoppingState({ items: [] }),
          }),
        })
      );
      actions$ = of(
        StorageActions.copyToShoppinglist(mockStorageItem({ name: 'Milk' }))
      );
      const emitted = await firstValueFrom(effects.copyToShoppingList$);
      expect(emitted.type).toBe('[Shopping] addOrUpdateItem');
      expect(
        (emitted as ReturnType<typeof ShoppingActions.addOrUpdateItem>).item
          .name
      ).toBe('Milk');
    });
  });
});
