import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockAppState } from '../../@shared/testing/test-data';
import {
  mockProductsState,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../testing/grocery.test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { StorageActions } from './storage.actions';
import { GroceriesActions } from './groceries.actions';
import { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
import { GrocerySaveEffects } from './grocery-save.effects';

describe('GrocerySaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: GrocerySaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        GrocerySaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(GrocerySaveEffects);
    return initialState;
  };

  it('persists the slice named by the action-source prefix', async () => {
    const storage = mockStorageState({ items: [mockStorageItem()] });
    setup(mockAppState({ storage }));
    actions$ = of(StorageActions.addItem(mockStorageItem()));
    await firstValueFrom(effects.saveOnChange$);
    expect(database.save).toHaveBeenCalledWith('storage', storage);
  });

  it('persists all three slices on a shared-catalog mutation', async () => {
    const products = mockProductsState();
    const shopping = mockShoppingState();
    const storage = mockStorageState();
    setup(mockAppState({ products, shopping, storage }));
    actions$ = of(GroceryCategoriesActions.add({ id: 'c1', name: 'Frozen' }));
    await firstValueFrom(effects.saveOnChange$);
    expect(database.save).toHaveBeenCalledWith('products', products);
    expect(database.save).toHaveBeenCalledWith('shopping', shopping);
    expect(database.save).toHaveBeenCalledWith('storage', storage);
  });

  it('does NOT persist on the [Groceries] co-hydration lifecycle', async () => {
    // Groceries hydrate via the separate `[Groceries]` source, which does not
    // match the `[Products|Shopping|Storage]` filter — so hydration can never
    // clobber the saved slices.
    setup(
      mockAppState({
        storage: mockStorageState({ items: [mockStorageItem()] }),
      })
    );
    actions$ = of(
      GroceriesActions.load(),
      GroceriesActions.loaded({
        products: mockProductsState(),
        shopping: mockShoppingState(),
        storage: mockStorageState(),
      })
    );

    const emitted = await firstValueFrom(effects.saveOnChange$.pipe(toArray()));

    expect(emitted).toEqual([]);
    expect(database.save).not.toHaveBeenCalled();
  });
});
