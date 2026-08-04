import { TestBed } from '@angular/core/testing';
import { ShareOptions } from '@capacitor/share';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ShareService } from '../../../@shared/data/services/share.service';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { ShoppingState } from '../../model/household-list.types';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/household.test-data';
import { StorageActions } from '../storage/storage.actions';
import { ShoppingActions } from './shopping.actions';
import { ShoppingEffects } from './shopping.effects';

describe('ShoppingEffects', () => {
  let actions$: Observable<Action>;
  let effects: ShoppingEffects;

  const share = vi.fn(async (_options: ShareOptions) => ({}));

  const setup = (shopping: ShoppingState = mockShoppingState()) => {
    TestBed.configureTestingModule({
      providers: [
        ShoppingEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({
            household: mockHouseholdState({ shopping }),
          }),
        }),
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
        { provide: ShareService, useValue: { share } },
      ],
    });
    effects = TestBed.inject(ShoppingEffects);
  };

  beforeEach(() => share.mockClear());

  it('buyItem$ marks the item bought rather than moving it', async () => {
    setup();
    const item = mockShoppingItem();
    actions$ = of(ShoppingActions.buyItem(item));
    expect(await firstValueFrom(effects.buyItem$)).toEqual(
      ShoppingActions.updateItem({ ...item, state: 'bought' })
    );
  });

  describe('moveToStorageList$', () => {
    const bread = mockShoppingItem({ id: 's1', name: 'Bread' });
    const milk = mockShoppingItem({ id: 's2', name: 'Milk', state: 'bought' });

    it('hands the storage list only the bought rows', async () => {
      setup(mockShoppingState({ items: [bread, milk] }));
      actions$ = of(ShoppingActions.moveToStorage());
      expect(await firstValueFrom(effects.moveToStorageList$)).toEqual(
        StorageActions.addShoppingList([milk])
      );
    });

    it('still emits with nothing bought, so no half of the round trip is skipped', async () => {
      setup(mockShoppingState({ items: [bread] }));
      actions$ = of(ShoppingActions.moveToStorage());
      expect(await firstValueFrom(effects.moveToStorageList$)).toEqual(
        StorageActions.addShoppingList([])
      );
    });
  });

  describe('shareShoppingList$', () => {
    it('shares one line per still-active row, quantity first', async () => {
      setup(
        mockShoppingState({
          items: [
            mockShoppingItem({ id: 's1', name: 'Bread', quantity: 2 }),
            mockShoppingItem({ id: 's2', name: 'Milk', state: 'bought' }),
          ],
        })
      );
      actions$ = of(ShoppingActions.shareShoppinglist());

      await firstValueFrom(effects.shareShoppingList$);

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'household.shopping.share.title',
          dialogTitle: 'household.shopping.share.dialog',
          text: '2 x Bread',
        })
      );
    });

    it('swallows a rejected share sheet', async () => {
      setup(mockShoppingState({ items: [mockShoppingItem()] }));
      share.mockRejectedValueOnce(new Error('dismissed'));
      actions$ = of(ShoppingActions.shareShoppinglist());

      await expect(
        firstValueFrom(effects.shareShoppingList$, { defaultValue: undefined })
      ).resolves.toBeUndefined();
    });
  });
});
