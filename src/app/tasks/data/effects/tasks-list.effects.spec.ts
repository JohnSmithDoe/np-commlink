import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import {
  mockKernelState,
  TMockState,
} from '../../../@shared/testing/test-data';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { TasksActions } from '../actions/tasks.actions';
import { tasksListEffects } from './tasks-list.effects';

describe('tasksListEffects', () => {
  let actions$: Observable<Action>;

  const setup = (state: TMockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState(state) }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it('addItemFromSearch$ builds a task from the search query', async () => {
    setup({ tasks: mockTasksState({ searchQuery: 'Call', items: [] }) });
    actions$ = of(TasksActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(tasksListEffects.addItemFromSearch$)
    );

    expect(emitted).toEqual(
      TasksActions.addItem(expect.objectContaining({ name: 'Call' }) as never)
    );
  });

  it('addItemFromSearch$ reports a duplicate instead of adding it again', async () => {
    const existing = mockTaskItem({ name: 'Call' });
    setup({
      tasks: mockTasksState({ searchQuery: 'Call', items: [existing] }),
    });
    actions$ = of(TasksActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(tasksListEffects.addItemFromSearch$)
    );

    expect(emitted).toEqual(TasksActions.addItemFailure(existing));
  });

  describe('addOrUpdateItem$', () => {
    it('updates a task that already exists', async () => {
      const item = mockTaskItem();
      setup({ tasks: mockTasksState({ items: [item] }) });
      actions$ = of(TasksActions.addOrUpdateItem(item));

      expect(
        await firstValueFrom(run(tasksListEffects.addOrUpdateItem$))
      ).toEqual(TasksActions.updateItem(item));
    });

    it('adds a task when the list is empty', async () => {
      const item = mockTaskItem();
      setup({ tasks: mockTasksState({ items: [] }) });
      actions$ = of(TasksActions.addOrUpdateItem(item));

      expect(
        await firstValueFrom(run(tasksListEffects.addOrUpdateItem$))
      ).toEqual(TasksActions.addItem(item));
    });
  });

  describe('clearFilter$', () => {
    it('clears the filter when leaving categories mode', async () => {
      setup();
      actions$ = of(TasksActions.updateMode('alphabetical'));

      expect(await firstValueFrom(run(tasksListEffects.clearFilter$))).toEqual(
        TasksActions.updateFilter()
      );
    });

    it('does not emit for categories mode', async () => {
      setup();
      actions$ = of(TasksActions.updateMode('categories'));

      expect(
        await firstValueFrom(run(tasksListEffects.clearFilter$).pipe(toArray()))
      ).toEqual([]);
    });
  });

  it('clearSearch$ resets the search on add item', async () => {
    setup();
    actions$ = of(TasksActions.addItem(mockTaskItem()));

    expect(await firstValueFrom(run(tasksListEffects.clearSearch$))).toEqual(
      TasksActions.updateSearch('')
    );
  });

  it('addItemFailure$ toasts a duplicate-name notice', async () => {
    setup();
    const item = mockTaskItem({ name: 'Call' });
    actions$ = of(TasksActions.addItemFailure(item));

    expect(await firstValueFrom(run(tasksListEffects.addItemFailure$))).toEqual(
      NotificationsActions.toast({
        key: 'toast.add.item.failure',
        params: { name: 'Call' },
        color: 'medium',
      })
    );
  });
});
