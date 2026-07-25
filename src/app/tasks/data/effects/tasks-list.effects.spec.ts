import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from '../../../@shared/testing/test-data';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { TasksActions } from '../tasks.actions';
import { TasksListEffects } from './tasks-list.effects';

describe('TasksListEffects', () => {
  let actions$: Observable<Action>;
  let effects: TasksListEffects;

  const setup = (initialState = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        TasksListEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
    effects = TestBed.inject(TasksListEffects);
  };

  it('addItemFromSearch$ builds a task from the search query', async () => {
    setup(
      mockAppState({
        tasks: mockTasksState({ searchQuery: 'Call', items: [] }),
      })
    );
    actions$ = of(TasksActions.addItemFromSearch());
    const emitted = await firstValueFrom(effects.addItemFromSearch$);
    expect(emitted.type).toBe('[Tasks] Add Item');
    expect((emitted as ReturnType<typeof TasksActions.addItem>).item.name).toBe(
      'Call'
    );
  });

  describe('addOrUpdateItem$', () => {
    it('updates a task that already exists', async () => {
      const item = mockTaskItem();
      setup(mockAppState({ tasks: mockTasksState({ items: [item] }) }));
      actions$ = of(TasksActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        TasksActions.updateItem(item)
      );
    });

    it('adds a task when the list is empty', async () => {
      const item = mockTaskItem();
      setup(mockAppState({ tasks: mockTasksState({ items: [] }) }));
      actions$ = of(TasksActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        TasksActions.addItem(item)
      );
    });
  });

  describe('clearFilter$', () => {
    it('clears the filter when leaving categories mode', async () => {
      setup();
      actions$ = of(TasksActions.updateMode('alphabetical'));
      expect(await firstValueFrom(effects.clearFilter$)).toEqual(
        TasksActions.updateFilter()
      );
    });

    it('does not emit for categories mode', () => {
      setup();
      actions$ = of(TasksActions.updateMode('categories'));
      const emissions: Action[] = [];
      effects.clearFilter$.subscribe((a) => emissions.push(a));
      expect(emissions).toEqual([]);
    });
  });

  it('clearSearch$ resets the search on add item', async () => {
    setup();
    actions$ = of(TasksActions.addItem(mockTaskItem()));
    expect(await firstValueFrom(effects.clearSearch$)).toEqual(
      TasksActions.updateSearch('')
    );
  });
});
