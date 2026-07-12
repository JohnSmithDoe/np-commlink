import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockCategoriesState,
  mockItemDialogsState,
  mockStorageItem,
  mockStorageState,
} from './@shared/testing/test-data';
import { StorageActions } from './storage/data/storage.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from './@shared/data/item-dialogs/item-dialogs.actions';
import { ItemDialogsEffects } from './item-dialogs.effects';

describe('ItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: ItemDialogsEffects;

  const dialogItem = mockStorageItem();
  const initialState = mockAppState({
    itemDialogs: mockItemDialogsState({
      listId: '_storage',
      item: dialogItem,
      category: mockCategoriesState({
        selection: ['Dairy'],
        searchQuery: ' Dairy ',
      }),
    }),
    storage: mockStorageState({ categories: ['Dairy'] }),
  });

  const setup = (state = initialState) => {
    TestBed.configureTestingModule({
      providers: [
        ItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(ItemDialogsEffects);
  };

  it('showCategories$ builds a selection from the active list categories', async () => {
    setup();
    actions$ = of(CategoriesActions.showDialog());
    expect(await firstValueFrom(effects.showCategories$)).toEqual(
      CategoriesActions.updateSelection(dialogItem, ['Dairy'])
    );
  });

  it('confirmCategories$ updates the dialog item with the selection', async () => {
    setup();
    actions$ = of(CategoriesActions.confirmChanges());
    expect(await firstValueFrom(effects.confirmCategories$)).toEqual(
      ItemDialogsActions.updateItem({ category: ['Dairy'] })
    );
  });

  it('addCategoryFromDialogSearch$ trims the dialog search query', async () => {
    setup();
    actions$ = of(CategoriesActions.addCategoryFromDialogSearch());
    expect(await firstValueFrom(effects.addCategoryFromDialogSearch$)).toEqual(
      CategoriesActions.addCategory('Dairy')
    );
  });

  it('confirmItemChanges$ forwards the edited item to the target list', async () => {
    setup();
    actions$ = of(ItemDialogsActions.confirmChanges());
    expect(await firstValueFrom(effects.confirmItemChanges$)).toEqual(
      StorageActions.addOrUpdateItem(dialogItem)
    );
  });
});
