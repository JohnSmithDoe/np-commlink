import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockTasksState } from '../../@shared/testing/test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { TasksActions } from './tasks.actions';
import { TasksLoadEffects } from './tasks-load.effects';

describe('TasksLoadEffects', () => {
  let actions$: Observable<Action>;
  let effects: TasksLoadEffects;
  let database: { load: ReturnType<typeof vi.fn> };

  const setup = () => {
    database = { load: vi.fn().mockResolvedValue(null) };
    TestBed.configureTestingModule({
      providers: [
        TasksLoadEffects,
        provideMockActions(() => actions$),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(TasksLoadEffects);
  };

  it('reads the tasks key and emits loaded', async () => {
    setup();
    const tasks = mockTasksState();
    database.load.mockResolvedValue(tasks);
    actions$ = of(TasksActions.load());

    expect(await firstValueFrom(effects.load$)).toEqual(
      TasksActions.loaded(tasks)
    );
    expect(database.load).toHaveBeenCalledWith('tasks');
  });

  it('falls back to loaded(null) when the read fails', async () => {
    setup();
    database.load.mockRejectedValue(new Error('storage unavailable'));
    actions$ = of(TasksActions.load());

    expect(await firstValueFrom(effects.load$)).toEqual(
      TasksActions.loaded(null)
    );
  });
});
