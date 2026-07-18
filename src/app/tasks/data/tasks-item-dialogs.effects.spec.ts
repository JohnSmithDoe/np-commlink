import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockItemDialogsState,
} from '../../@shared/testing/test-data';
import { mockTasksState } from '../testing/tasks.test-data';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { TasksActions } from './tasks.actions';
import { TasksItemDialogsEffects } from './tasks-item-dialogs.effects';

describe('TasksItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: TasksItemDialogsEffects;

  const setup = (state = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        TasksItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(TasksItemDialogsEffects);
  };

  it('confirmEditCategoryChanges$ forwards a renamed category to TasksActions', async () => {
    setup(
      mockAppState({
        itemDialogs: mockItemDialogsState({
          listId: '_tasks',
          category: { isEditing: true, original: 'Home', editItem: 'Errands' },
        }),
      })
    );
    actions$ = of(CategoriesActions.confirmEditChanges());
    expect(await firstValueFrom(effects.confirmEditCategoryChanges$)).toEqual(
      TasksActions.updateCategory('Home', 'Errands')
    );
  });

  // Both orchestrators stay registered once both route sets are visited, so
  // tasks MUST ignore a grocery dialog (else it dispatches TasksActions onto it).
  it('confirmEditCategoryChanges$ ignores a grocery (_storage) dialog', () => {
    setup(
      mockAppState({
        itemDialogs: mockItemDialogsState({
          listId: '_storage',
          category: { isEditing: true, original: 'X', editItem: 'Y' },
        }),
      })
    );
    actions$ = of(CategoriesActions.confirmEditChanges());
    const out: Action[] = [];
    effects.confirmEditCategoryChanges$.subscribe((a) => out.push(a));
    expect(out).toEqual([]);
  });

  it('showCreateDialogWithSearch$ opens the rename dialog in categories mode', async () => {
    setup(
      mockAppState({
        tasks: mockTasksState({ mode: 'categories', searchQuery: 'Home' }),
      })
    );
    actions$ = of(ItemDialogsActions.showCreateDialogWithSearch('_tasks'));
    expect(await firstValueFrom(effects.showCreateDialogWithSearch$)).toEqual(
      CategoriesActions.showEditDialog('Home', '_tasks')
    );
  });

  it('showCreateDialogWithSearch$ opens a create dialog seeded from the search term', async () => {
    setup(mockAppState({ tasks: mockTasksState({ searchQuery: 'Buy milk' }) }));
    actions$ = of(ItemDialogsActions.showCreateDialogWithSearch('_tasks'));
    const action = (await firstValueFrom(
      effects.showCreateDialogWithSearch$
    )) as ReturnType<typeof ItemDialogsActions.showEditDialog>;
    expect(action.type).toBe(ItemDialogsActions.showEditDialog.type);
    expect(action.listId).toBe('_tasks');
    expect(action.item.name).toBe('Buy milk');
  });

  it('showCreateDialogWithSearch$ ignores a grocery listId', () => {
    setup();
    actions$ = of(ItemDialogsActions.showCreateDialogWithSearch('_storage'));
    const out: Action[] = [];
    effects.showCreateDialogWithSearch$.subscribe((a) => out.push(a));
    expect(out).toEqual([]);
  });
});
