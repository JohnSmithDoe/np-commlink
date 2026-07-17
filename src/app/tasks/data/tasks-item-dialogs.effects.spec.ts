import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockCategoriesState,
  mockItemDialogsState,
  mockTaskItem,
  mockTasksState,
} from '../../@shared/testing/test-data';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { TasksActions } from './tasks.actions';
import { TasksItemDialogsEffects } from './tasks-item-dialogs.effects';

describe('TasksItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: TasksItemDialogsEffects;

  const dialogItem = mockTaskItem();
  const initialState = mockAppState({
    itemDialogs: mockItemDialogsState({
      listId: '_tasks',
      item: dialogItem,
      category: mockCategoriesState({
        selection: ['Home'],
        searchQuery: ' Home ',
      }),
    }),
    tasks: mockTasksState({ categories: ['Home'] }),
  });

  const setup = (state = initialState) => {
    TestBed.configureTestingModule({
      providers: [
        TasksItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(TasksItemDialogsEffects);
  };

  it('showCategories$ builds a selection from the tasks categories', async () => {
    setup();
    actions$ = of(CategoriesActions.showDialog());
    expect(await firstValueFrom(effects.showCategories$)).toEqual(
      CategoriesActions.updateSelection(dialogItem, ['Home'])
    );
  });

  it('confirmCategories$ updates the dialog item with the selection', async () => {
    setup();
    actions$ = of(CategoriesActions.confirmChanges());
    expect(await firstValueFrom(effects.confirmCategories$)).toEqual(
      ItemDialogsActions.updateItem({ category: ['Home'] })
    );
  });

  it('addCategoryFromDialogSearch$ trims the dialog search query', async () => {
    setup();
    actions$ = of(CategoriesActions.addCategoryFromDialogSearch());
    expect(await firstValueFrom(effects.addCategoryFromDialogSearch$)).toEqual(
      CategoriesActions.addCategory('Home')
    );
  });

  it('confirmItemChanges$ forwards the edited task to TasksActions (listId _tasks)', async () => {
    setup();
    actions$ = of(ItemDialogsActions.confirmChanges());
    expect(await firstValueFrom(effects.confirmItemChanges$)).toEqual(
      TasksActions.addOrUpdateItem(dialogItem)
    );
  });

  // Both dialog orchestrators stay registered once both route sets are visited
  // (injectors/effects are not torn down), so tasks MUST ignore grocery dialogs
  // — otherwise it dispatches TasksActions onto a grocery dialog (cross-list
  // corruption).
  describe('listId guards — ignores a grocery dialog', () => {
    const groceryDialog = mockAppState({
      itemDialogs: mockItemDialogsState({
        listId: '_storage',
        category: mockCategoriesState({ selection: ['X'], searchQuery: 'X' }),
      }),
    });
    const noEmit = (source: Observable<Action>) => {
      const out: Action[] = [];
      source.subscribe((a) => out.push(a));
      return out;
    };

    it('confirmItemChanges$ ignores a _storage dialog', () => {
      setup(groceryDialog);
      actions$ = of(ItemDialogsActions.confirmChanges());
      expect(noEmit(effects.confirmItemChanges$)).toEqual([]);
    });

    it('addCategoryToList$ ignores a _storage dialog', () => {
      setup(groceryDialog);
      actions$ = of(CategoriesActions.addCategory('X'));
      expect(noEmit(effects.addCategoryToList$)).toEqual([]);
    });

    it('confirmCategories$ ignores a _storage dialog', () => {
      setup(groceryDialog);
      actions$ = of(CategoriesActions.confirmChanges());
      expect(noEmit(effects.confirmCategories$)).toEqual([]);
    });
  });
});
