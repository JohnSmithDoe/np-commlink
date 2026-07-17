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
} from '../../../@shared/testing/test-data';
import { StorageActions } from '../storage.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { GroceryItemDialogsEffects } from './grocery-item-dialogs.effects';

describe('GroceryItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: GroceryItemDialogsEffects;

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
        GroceryItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(GroceryItemDialogsEffects);
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

  // Both dialog orchestrators stay registered once both route sets are visited
  // (injectors/effects are not torn down), so the grocery one MUST ignore a
  // tasks dialog — otherwise it routes into actionsByListId('_tasks') → throw.
  describe('listId guards — ignores a tasks dialog', () => {
    const tasksDialog = mockAppState({
      itemDialogs: mockItemDialogsState({
        listId: '_tasks',
        category: mockCategoriesState({ selection: ['X'], searchQuery: 'X' }),
      }),
    });
    const noEmit = (source: Observable<Action>) => {
      const out: Action[] = [];
      source.subscribe((a) => out.push(a));
      return out;
    };

    it('confirmItemChanges$ does not act on a _tasks dialog (no throw)', () => {
      setup(tasksDialog);
      actions$ = of(ItemDialogsActions.confirmChanges());
      expect(noEmit(effects.confirmItemChanges$)).toEqual([]);
    });

    it('addCategoryToList$ does not act on a _tasks dialog', () => {
      setup(tasksDialog);
      actions$ = of(CategoriesActions.addCategory('X'));
      expect(noEmit(effects.addCategoryToList$)).toEqual([]);
    });

    it('confirmCategories$ does not act on a _tasks dialog', () => {
      setup(tasksDialog);
      actions$ = of(CategoriesActions.confirmChanges());
      expect(noEmit(effects.confirmCategories$)).toEqual([]);
    });
  });
});
