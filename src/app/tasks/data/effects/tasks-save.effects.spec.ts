import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockAppState } from '../../../@shared/testing/test-data';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { TasksActions } from '../tasks.actions';
import { TasksSaveEffects } from './tasks-save.effects';

describe('TasksSaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: TasksSaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        TasksSaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(TasksSaveEffects);
    return initialState;
  };

  it('does NOT persist on the [Tasks] load/loaded hydration lifecycle', async () => {
    // Regression: `[Tasks] load` fires on route entry at empty initialState
    // before the load effect reads storage — persisting here would clobber the
    // saved tasks.
    setup(mockAppState({ tasks: mockTasksState({ items: [mockTaskItem()] }) }));
    actions$ = of(TasksActions.load(), TasksActions.loaded(mockTasksState()));

    const emitted = await firstValueFrom(effects.saveOnChange$.pipe(toArray()));

    expect(emitted).toEqual([]);
    expect(database.save).not.toHaveBeenCalled();
  });

  it('persists on a real [Tasks] mutation', async () => {
    const tasks = mockTasksState({ items: [mockTaskItem()] });
    setup(mockAppState({ tasks }));
    actions$ = of(TasksActions.addItem(mockTaskItem()));

    await firstValueFrom(effects.saveOnChange$);

    expect(database.save).toHaveBeenCalledWith('tasks', tasks);
  });
});
